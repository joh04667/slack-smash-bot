var Slackbot = require('slackbots');
require('dotenv').config();

var bot = new Slackbot(
  token: process.env.SLACK_TOKEN,
  name: "smashbot"
);
