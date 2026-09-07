const axios = require('axios');
const env = require('../config/env');
const { ApplicationDocument, DocumentRequirement, Application, Administrator, Notification } = require('../models/mongo');

const parseDataUrl = value => {
  const match = /^data:([^;]+);base64,(.+)$/.exec(value || '');
  return match ? { mimeType: match[1], base64: match[2] } : null;
};

const extractJson = content => {
  const text = String(content || '').trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(text);
};

const buildPrompt = (document, requirement) => `Tu es un assistant de pre-verification documentaire pour un concours. Analyse uniquement le fichier fourni. Ne prends jamais la decision administrative finale. Retourne exclusivement un JSON valide avec les cles recommendation (approve, reject ou review), confidence (nombre entre 0 et 1) et reason (phrase courte en francais). Type de document : "${document.type}". Description officielle : "${requirement?.description || 'Aucune'}". Consignes de validation de l'administrateur : "${requirement?.aiValidationInstructions || 'Verifier la lisibilite, le type et la presence des informations attendues.'}". Regles de rejet de l'administrateur : "${requirement?.aiRejectionRules || 'Rejeter si le document est illisible, incomplet, du mauvais type ou manifestement non conforme.'}". En cas de doute ou de consigne contradictoire, choisis review. Ne conclus jamais a une fraude sur la seule base d'une anomalie visuelle.`;

async function analyzeDocument(documentId) {
  if (!env.openaiApiKey) {
    await ApplicationDocument.findByIdAndUpdate(documentId, { $set: { aiStatus: 'disabled', aiError: 'OPENAI_API_KEY non configuree' } });
    return;
  }

  const document = await ApplicationDocument.findById(documentId).lean();
  if (!document) return;
  const [requirement, application] = await Promise.all([
    document.requirementId ? DocumentRequirement.findById(document.requirementId).lean() : null,
    Application.findById(document.applicationId).populate('contestId').lean()
  ]);
  const data = parseDataUrl(document.contentData);
  if (!data) throw new Error('Contenu du document indisponible');

  await ApplicationDocument.findByIdAndUpdate(documentId, { $set: { aiStatus: 'running', aiError: undefined } });

  const userContent = [{ type: 'text', text: buildPrompt(document, requirement) }];
  if (data.mimeType.startsWith('image/')) {
    userContent.push({ type: 'image_url', image_url: { url: `data:${data.mimeType};base64,${data.base64}`, detail: 'high' } });
  } else {
    userContent.push({ type: 'text', text: `Le document est un PDF nomme "${document.originalName || 'document.pdf'}". Le contenu textuel doit etre controle par un administrateur; recommande review si le fichier ne peut pas etre inspecte visuellement.` });
  }

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: env.openaiModel,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: userContent }]
    }, { headers: { Authorization: `Bearer ${env.openaiApiKey}`, 'Content-Type': 'application/json' }, timeout: 60000 });
    const result = extractJson(response.data?.choices?.[0]?.message?.content);
    const recommendation = ['approve', 'reject', 'review'].includes(result.recommendation) ? result.recommendation : 'review';
    const confidence = Math.min(1, Math.max(0, Number(result.confidence) || 0));
    const reason = String(result.reason || 'Verification administrative requise').slice(0, 500);
    const automaticStatus = recommendation === 'approve' ? 'approved' : recommendation === 'reject' ? 'rejected' : 'uploaded';
    const update = {
      aiStatus: 'completed',
      aiRecommendation: recommendation,
      aiConfidence: confidence,
      aiReason: reason,
      aiAnalyzedAt: new Date(),
      status: automaticStatus,
      ...(automaticStatus === 'rejected' ? { rejectionReason: `Rejet automatique IA : ${reason}` } : { rejectionReason: undefined })
    };
    const savedDocument = await ApplicationDocument.findByIdAndUpdate(documentId, { $set: update }, { new: true }).lean();
    if (!application || !savedDocument) return;

    try {
      const documentLabel = document.type || document.originalName || 'document';
      const candidateBody = recommendation === 'approve'
        ? `Votre document « ${documentLabel} » a été validé automatiquement après contrôle IA.`
        : recommendation === 'reject'
          ? `Votre document « ${documentLabel} » a été rejeté automatiquement. Motif : ${reason}`
          : `Votre document « ${documentLabel} » a été analysé. Une vérification humaine est requise.`;
      await Notification.create({
        candidateId: application.candidateId,
        applicationId: application._id,
        legacyNupcan: application.nupcan,
        title: recommendation === 'approve' ? 'Document validé automatiquement' : recommendation === 'reject' ? 'Document rejeté automatiquement' : 'Vérification humaine requise',
        body: candidateBody,
        channel: 'in_app'
      });

      const establishmentId = application.contestId?.establishmentId;
      if (establishmentId) {
        const administrators = await Administrator.find({
          active: true,
          $and: [
            { $or: [{ role: 'super_admin' }, { establishmentIds: establishmentId }] },
            { $or: [{ permissions: 'view_documents' }, { permissions: 'validate_documents' }, { role: { $in: ['super_admin', 'admin', 'admin_etablissement', 'reviewer'] } }] }
          ]
        }).select('_id').lean();
        if (administrators.length) {
          await Notification.insertMany(administrators.map(admin => ({
            recipientAdministratorId: admin._id,
            applicationId: application._id,
            legacyNupcan: application.nupcan,
            title: 'Rapport de contrôle IA disponible',
            body: `${documentLabel} : ${recommendation === 'approve' ? 'validé automatiquement' : recommendation === 'reject' ? 'rejeté automatiquement' : 'à vérifier manuellement'} (${Math.round(confidence * 100)} %). ${reason}`,
            channel: 'in_app'
          })));
        }
      }
    } catch (notificationError) {
      console.error(JSON.stringify({ level: 'error', code: 'DOCUMENT_AI_NOTIFICATION_FAILED', documentId: String(documentId), message: notificationError.message }));
    }
  } catch (error) {
    await ApplicationDocument.findByIdAndUpdate(documentId, { $set: { aiStatus: 'failed', aiError: String(error.response?.data?.error?.message || error.message).slice(0, 500), aiAnalyzedAt: new Date() } });
    throw error;
  }
}

function queueDocumentAnalysis(documentId) {
  setImmediate(() => analyzeDocument(documentId).catch(error => console.error(JSON.stringify({ level: 'error', code: 'DOCUMENT_AI_ANALYSIS_FAILED', documentId: String(documentId), message: error.message }))));
}

module.exports = { analyzeDocument, queueDocumentAnalysis };