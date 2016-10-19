var SmashBot = require('./lib/smashbot');
require('dotenv').config()




var smashbot = new SmashBot({
  token: process.env.SLACK_TOKEN,
  name: 'smashbot',
  challonge_key: process.env.CHALLONGE_KEY
})

smashbot.run()
