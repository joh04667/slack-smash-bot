var util = require('util');
var path = require('path');
var fs = require('fs');
var Bot = require('slackbots');
var api_util = require('./api')

var SmashBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'smashbot';
    this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'smashbot.db');

    this.user = null;
    this.db = null;

    this._getChannelById = function(channelId) {
      return this.channels.find(s => s.id === channelId);
    };



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
  console.log(parse);
  return {
    text: parse ? parse[1] : '',
    users: parse && parse[2] ? parse[2].split(/\W/).filter(s => s) : []
  }
}

SmashBot.prototype._executeCommand = function (message) {
  message.command = this._parseCommand(message);
  message.channel = this._getChannelById(message.channel);
  console.log(message.command);


  if(this.commands[message.command.text]) {

     this.commands[message.command.text].call(this, message)

  } else {



    // This is just a DRY function to reply to same channel.
    // Note arrow function lexically binds 'this' :)

    var reply = (text) => {
      this.postMessageToChannel(message.channel.name, text, {as_user:true});
    }

    switch(message.command.text.toLowerCase()) {
      case 'hi':
        reply('Heyo');
        break;
      case 'sup':
        reply('Not much, just waiting to smash');
        break;
      case '':
        reply('wat');
        break;


      default:
      console.log('test', !!this['_' + message.command.text]);
        reply(`I don't know that command`);
    }
  }
}



SmashBot.prototype.commands = {
  help: function(message) {
    console.log(message);

    this.postMessageToChannel(message.channel.name,
`Here's how to tell me what to do:
\`\`\`Type 'smashbot' then.....

help: get this message (duh)

tournament: open a new tournament for people to join (only 1 can be open at a time)

add player1, player2... : Add players to the current tournament (either separate with spaces or commas)

status: Get an image of the current tournament and list of players signed up

delete: Delete an open tournament if one exists\`\`\``,
      {as_user:true})
  },

  tournament: function(message) {
    api_util.createTourney()
      .then(response => {

        // console.log(response);
        this.postMessageToChannel(message.channel.name,
          `Okay. Started a new tournament.
          See it live here: ${response.tournament.full_challonge_url}
          Click here to sign up:`, {as_user: true})
      })
      .catch(err => {
        console.log(err);
        console.log('error dammit');
      })
  },

  add: function(message) {
    console.log(message.command.users);
    api_util.getCurrentTourney()
      .then(res => {
        if(!res.length) {
          this.postMessageToChannel(message.channel.name, `No open tournament right now tho. Open a new one with \`smashbot tournament\` first`, {as_user: true})
        } else {
          api_util.addPlayers(res[0].tournament.id, message.command.users)
            .then(console.log('didididididid'))
            .catch(err => console.log('got an error'))
        }
      })
      .catch(err => {
        this.postMessageToChannel(message.channel.name, `error :(  ${err})`, {as_user: true});
      })
  },
// No open tournament right now tho. Open a new one with \`smashbot tournament\` first
  status: function(message) {

  },

  delete: function(message) {
    api_util.deleteTourney()
      .then(response => {
        this.postMessageToChannel(message.channel.name, `okay i deleted it`, {as_user: true});
      })
      .catch(err => {
        this.postMessageToChannel(message.channel.name, `there wasn't an open tournament man`, {as_user: true});
      })
  }

}


module.exports = SmashBot;
