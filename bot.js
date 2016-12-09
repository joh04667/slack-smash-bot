require('dotenv').config()

var SmashBot = require('./lib/smashbot');


var testbot = new SmashBot({
  token: process.env.SLACK_TOKEN,
  name: 'smashbot',
  challonge_key: process.env.CHALLONGE_KEY,
  owner: 'kyle.johnson'
})



testbot.run();
