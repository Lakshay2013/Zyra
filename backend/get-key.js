const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://localhost:27018/ai-shield');
  const org = await mongoose.connection.db.collection('orgs').findOne({'providerKeys.groq': {$exists: true}});
  if (org) {
    console.log('FOUND GROQ KEY:', org.providerKeys.groq);
    console.log('ORG ID:', org._id);
  } else {
    console.log('NO GROQ KEY FOUND');
  }
  await mongoose.disconnect();
}
main();
