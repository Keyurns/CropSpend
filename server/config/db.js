const mongoose = require('mongoose');

try {
  require('dns').setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const isSrvRefused = (err) =>
  err.message && (
    err.message.includes('querySrv') ||
    err.message.includes('ECONNREFUSED') ||
    err.code === 'ENOTFOUND'
  );

const connectDB = async (onSuccess) => {
  const srvURI = process.env.MONGODB_URI || 'mongodb+srv://keyurkns2004:keyur7604@cluster0.hln29kt.mongodb.net/expense-tracker';
  const directURI = process.env.MONGODB_URI_DIRECT;
  const options = { useNewUrlParser: true, useUnifiedTopology: true };

  const tryConnect = async (uri, label) => {
    console.log(`Attempting to connect to MongoDB (${label})...`);
    return mongoose.connect(uri, options);
  };

  try {
    let conn;
    try {
      conn = await tryConnect(srvURI, 'SRV');
    } catch (srvErr) {
      if (directURI && isSrvRefused(srvErr)) {
        console.log('SRV connection failed (often DNS/firewall). Trying direct connection...');
        conn = await tryConnect(directURI, 'direct');
      } else {
        throw srvErr;
      }
    }

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database name: ${conn.connection.name}`);
    console.log(`MongoDB version: ${(await conn.connection.db.admin().buildInfo()).version}`);

    if (onSuccess) onSuccess();
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    if (isSrvRefused(error)) {
      console.error('\nYour network or DNS is blocking SRV lookups (querySrv). Two options:');
      console.error('1. Add a DIRECT connection string in .env (get it from Atlas):');
      console.error('   MONGODB_URI_DIRECT=mongodb://USER:PASS@cluster0-shard-00-00.hln29kt.mongodb.net:27017,cluster0-shard-00-01.hln29kt.mongodb.net:27017,cluster0-shard-00-02.hln29kt.mongodb.net:27017/?ssl=true&replicaSet=atlas-XXXXX-shard-0&authSource=admin');
      console.error('   (In Atlas: Cluster → Connect → "Connect your application" → look for "Direct connection" or copy hostnames from the cluster.)');
      console.error('2. Or use a different network (e.g. turn off VPN) or DNS (e.g. 8.8.8.8) and try again.');
    } else {
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
};

module.exports = connectDB; 