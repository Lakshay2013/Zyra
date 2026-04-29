const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://localhost:27018/ai-shield');
  // Get latest 5 users
  const users = await mongoose.connection.db.collection('users').find().sort({createdAt: -1}).limit(5).toArray();
  for (const user of users) {
    const org = await mongoose.connection.db.collection('orgs').findOne({_id: user.orgId});
    const key = await mongoose.connection.db.collection('apikeys').findOne({orgId: user.orgId});
    console.log(`User: ${user.email} | Org: ${org?.name} | API Key: ${key?.key}`);
  }
  await mongoose.disconnect();
}
main();
