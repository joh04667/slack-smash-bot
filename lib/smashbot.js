var util = require('util');
var path = require('path');
var fs = require('fs');
var Bot = require('slackbots');


var SmashBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'smashbot';
    this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'smashbot.db');

    this.user = null;
    this.db = null;
    this._getChannelById = function(channelId) {
      return this.channels.find(s => s.id === channelId);
    }
};

util.inherits(SmashBot, Bot);



SmashBot.prototype.run = function () {
    SmashBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
};


SmashBot.prototype._onStart = function () {
    this._loadBotUser();
    //this._connectDb();
    this._welcomeMessage();
    console.log('we started');
};


SmashBot.prototype._loadBotUser = function () {
    var self = this;

    this.user = this.users.find(s => s.name === self.name);
};

SmashBot.prototype._welcomeMessage = function () {
  this.channelList = this.channels.filter(s => s.is_member);

  /* this.channelList.forEach(s => {
    this.postMessageToChannel(s.name, 'test', {as_user: true});
  }) */
}

SmashBot.prototype._onMessage = function(message) {
  if(this._isMentioningMe(message)) {
    this._executeCommand(message);
  }
}

// check if message is a message event and if the first word is smashbot
SmashBot.prototype._isMentioningMe = function(message) {
  return message.type === 'message' && /^smashbot\b/i.test(message.text);
}

// parses command passed to Smashbot and makes an object of the command and users passed
SmashBot.prototype._parseCommand = function (message) {
  var parse = message.text.match(/^smashbot\s(\w+)\s?(.+)?/i);
  return command = {
    text: parse[1],
    users: parse[2] ? parse[2].split(/\W/).filter(s => s) : []
  }
}

SmashBot.prototype._executeCommand = function (message) {
  var command = this._parseCommand(message);
  var channel = this._getChannelById(message.channel);

  // This is just a DRY function to reply to same channel.
  // Note arrow function lexically binds 'this' :)
  var reply = (text) => {
    this.postMessageToChannel(channel.name, text, {as_user:true});
  }


  console.log(command);

  switch(command.text.toLowerCase()) {
    case 'hi':
      reply('Heyo');
      break;
    case 'sup':
      reply('Not much, just waiting to smash');
      break;
    default:
      reply(`I don't know that command`);

  }
}

module.exports = SmashBot;
