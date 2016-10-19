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
  console.log(message);
}

module.exports = SmashBot;
