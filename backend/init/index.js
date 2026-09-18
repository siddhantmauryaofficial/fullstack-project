const mongoose = require('mongoose');
require('dotenv').config();
const dns = require('dns');
dns.setServers(
  (process.env.DNS_SERVERS || '1.1.1.1,8.8.8.8')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean)
);
const initData = require('./data.js');
const listing = require('../models/listing.js');

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  throw new Error('MONGO_URL is missing. Add it to your .env file.');
}

main()
  .then(() => {
    console.log('connected to DB');
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await listing.deleteMany({});
  await listing.insertMany(initData.data);
  console.log('data was initialized');
};

initDB();
