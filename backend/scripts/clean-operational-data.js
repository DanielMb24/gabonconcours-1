const { connectMongo, disconnectMongo } = require('../config/mongodb');
const {
  Candidate, Administrator, Application, ApplicationDocument, Payment, Grade,
  Notification, Message, Receipt, Session, VerificationCode, LoginAttempt,
  DocumentAccessLog, SupportRequest, AuditLog, Counter
} = require('../models/mongo');

const collections = [
  ['candidats', Candidate],
  ['administrateurs hors super_admin', Administrator],
  ['candidatures / dossiers', Application],
  ['documents', ApplicationDocument],
  ['paiements', Payment],
  ['notes', Grade],
  ['notifications', Notification],
  ['messages', Message],
  ['reçus', Receipt],
  ['sessions', Session],
  ['codes de vérification', VerificationCode],
  ['tentatives de connexion', LoginAttempt],
  ['journaux d’accès aux documents', DocumentAccessLog],
  ['demandes de support', SupportRequest],
  ['journaux d’audit', AuditLog]
];

async function countDocuments(model, filter = {}) {
  return model.countDocuments(filter);
}

async function main() {
  const apply = process.argv.includes('--apply');
  await connectMongo();

  try {
    const preview = {};
    for (const [name, model] of collections) {
      const filter = model === Administrator ? { role: { $ne: 'super_admin' } } : {};
      preview[name] = await countDocuments(model, filter);
    }

    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', willDelete: preview }, null, 2));
    if (!apply) {
      console.log('Aucune donnée supprimée. Relancez avec --apply après vérification.');
      return;
    }

    for (const [name, model] of collections) {
      const filter = model === Administrator ? { role: { $ne: 'super_admin' } } : {};
      const result = await model.deleteMany(filter);
      console.log(`${name}: ${result.deletedCount} supprimé(s)`);
    }

    await Counter.deleteMany({});
    console.log('compteurs NIPCAN/NUPCAN: réinitialisés');
  } finally {
    await disconnectMongo();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});