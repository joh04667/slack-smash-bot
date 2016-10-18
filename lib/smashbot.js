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

    this.on('start', this._onStart());
    this.on('message', this._onMessage());
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

SmashBot.prototype_welcomeMessage = function () {
  console.log(this.channels[0]);
  //this.postMessageToChannel(this.channels[0].name, 'SMASH', {as_user: true});
}



module.exports = SmashBot;
