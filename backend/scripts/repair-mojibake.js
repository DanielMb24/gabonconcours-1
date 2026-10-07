// Répare le mojibake d'encodage (ex. latin1 stocké comme UTF-8 : "annÃ©e").
// Usage : node scripts/repair-mojibake.js [--apply]
// Sans --apply : diagnostic seul (aucune écriture).
const { connectMongo, disconnectMongo } = require('../config/mongodb');
const models = require('../models/mongo');

// Motifs typiques d'un texte latin1 mal décodé en UTF-8.
const MOJIBAKE = /Ã[€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ ]|Ã[©¨ª«­®¯°±²³´µ¶·¸¹º»¼½¾¿À-Þ]|�/;
const APPLY = process.argv.includes('--apply');

const fixString = (value) => {
  if (typeof value !== 'string' || !MOJIBAKE.test(value)) return null;
  try {
    const fixed = Buffer.from(value, 'latin1').toString('utf8');
    // On ne garde la correction que si elle fait disparaître les marqueurs.
    if (fixed !== value && !MOJIBAKE.test(fixed)) return fixed;
  } catch { /* ignore */ }
  return null;
};

const TARGETS = {
  Candidate: ['firstName', 'lastName', 'birthPlace', 'nationalId'],
  Application: [],
  Contest: ['title', 'description', 'session'],
  Program: ['name', 'description'],
  Establishment: ['name', 'address'],
  EducationLevel: ['name', 'description'],
  DocumentRequirement: ['name', 'description'],
  Subject: ['name'],
  Province: ['name'],
  Message: ['subject', 'body'],
  Notification: ['title', 'body'],
};

(async () => {
  await connectMongo();
  const report = [];
  try {
    for (const [modelName, fields] of Object.entries(TARGETS)) {
      const Model = models[modelName];
      if (!Model) continue;
      const docs = await Model.find({}).select(['_id', ...fields].join(' ')).lean();
      let scanned = 0;
      let fixed = 0;
      for (const doc of docs) {
        scanned++;
        const update = {};
        for (const field of fields) {
          const corrected = fixString(doc[field]);
          if (corrected !== null) update[field] = corrected;
        }
        if (Object.keys(update).length > 0) {
          fixed++;
          if (APPLY) await Model.updateOne({ _id: doc._id }, { $set: update });
          else report.push({ model: modelName, id: String(doc._id), avant: Object.fromEntries(Object.entries(update).map(([k]) => [k, doc[k]])), apres: update });
        }
      }
      console.log(`${modelName}: ${scanned} lus, ${fixed} à corriger${APPLY ? ' (corrigés)' : ''}`);
    }
    if (!APPLY && report.length > 0) {
      console.log(JSON.stringify({ exemples: report.slice(0, 10), total: report.length }, null, 2));
    }
    if (!APPLY) console.log('Mode diagnostic : relancez avec --apply pour écrire.');
  } finally {
    await disconnectMongo();
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
