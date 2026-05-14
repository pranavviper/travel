const mongoose = require('mongoose');

async function testConnection(uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ Success: ${uri}`);
    await mongoose.disconnect();
  } catch (err) {
    console.log(`❌ Failed: ${uri}`);
  }
}

async function run() {
  await testConnection('mongodb+srv://popzdesigngroup_db_user:Y6TdoQ1FVHl7BCa7@cluster0.izcqonz.mongodb.net/meetmind?retryWrites=true&w=majority');
  await testConnection('mongodb+srv://popzdesigngroup_db_user:9f1jtXYB0W04p0PI@cluster0.kvb5kii.mongodb.net/roadsage?retryWrites=true&w=majority');
}

run();
