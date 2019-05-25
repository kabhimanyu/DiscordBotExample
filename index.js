require("dotenv").config();
const Client = require('./client/client');
const client = new Client();
client.login(process.env.BOT_TOKEN)
