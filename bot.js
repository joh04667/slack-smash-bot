require('dotenv').config();
var http = require('http');


http.listen(process.env.PORT || 5000)

var SmashBot = require('./lib/smashbot');


var smashbot = new SmashBot({
  token: process.env.SLACK_KEY,
  name: 'smashbot',
  challonge_key: process.env.CHALLONGE_KEY,
  owner: 'kyle.johnson'
})

smashbot.run();
