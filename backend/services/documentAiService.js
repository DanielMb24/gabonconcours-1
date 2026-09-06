const axios = require('axios');
const env = require('../config/env');
const { ApplicationDocument, DocumentRequirement } = require('../models/mongo');

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
  const requirement = document.requirementId ? await DocumentRequirement.findById(document.requirementId).lean() : null;
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
    await ApplicationDocument.findByIdAndUpdate(documentId, { $set: { aiStatus: 'completed', aiRecommendation: recommendation, aiConfidence: confidence, aiReason: String(result.reason || 'Verification administrative requise').slice(0, 500), aiAnalyzedAt: new Date() } });
  } catch (error) {
    await ApplicationDocument.findByIdAndUpdate(documentId, { $set: { aiStatus: 'failed', aiError: String(error.response?.data?.error?.message || error.message).slice(0, 500), aiAnalyzedAt: new Date() } });
    throw error;
  }
}

function queueDocumentAnalysis(documentId) {
  setImmediate(() => analyzeDocument(documentId).catch(error => console.error(JSON.stringify({ level: 'error', code: 'DOCUMENT_AI_ANALYSIS_FAILED', documentId: String(documentId), message: error.message }))));
}

module.exports = { analyzeDocument, queueDocumentAnalysis };