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

    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
};

SmashBot.prototype._welcomeMessage = function () {
  this.channelList = this.channels.filter(s => s.is_member);

  /* this.channelList.forEach(s => {
    this.postMessageToChannel(s.name, 'test', {as_user: true});
  }) */

}

SmashBot.prototype._onMessage = function(message) {
  if(this._isMentioningMe(message)) {
    console.log(this._parseCommands(message));
  }
}

// check if message is a message event and if the first word is smashbot
SmashBot.prototype._isMentioningMe = function(message) {
  return message.type === 'message' && /^smashbot\b/i.test(message.text);
}

// returns a string of anything after 'smashbot' in message text
SmashBot.prototype._parseCommands = function (message) {
  return message.text.match(/^smashbot\b (.+)/)[1];
}

module.exports = SmashBot;
