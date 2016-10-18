var SmashBot = require('./lib/smashbot');
require('dotenv').config()


var smashbot = new SmashBot({
  token: process.env.SLACK_TOKEN,
  name: 'smashbot'
})

smashbot.run()
