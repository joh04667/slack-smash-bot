var util = require('util');
var path = require('path');
var fs = require('fs');
var Bot = require('slackbots');
var api_util = require('./api');
var webshot = require('webshot'); // TODO: Change to the node module when npm is back up

var SmashBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'smashbot';
    this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'smashbot.db');

    this.user = null;
    this.db = null;

    this._getChannelById = function(channelId) {
        return this.channels.find(s => s.id === channelId);
    };

    this._getUserById = function(userId) {
      console.log('called');
      console.log(this.users.find(s => s.id === userId));
      return this.users.find(s => s.id === userId);
    };
};




util.inherits(SmashBot, Bot);



SmashBot.prototype.run = function() {
    SmashBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
};


SmashBot.prototype._onStart = function() {
    this._loadBotUser();
    //this._connectDb();
    this._welcomeMessage();
    console.log('we started');
};


SmashBot.prototype._loadBotUser = function() {
    var self = this;

    this.user = this.users.find(s => s.name === self.name);
};

SmashBot.prototype._welcomeMessage = function() {
    this.channelList = this.channels.filter(s => s.is_member);

    /* this.channelList.forEach(s => {
      this.postMessageToChannel(s.name, 'test', {as_user: true});
    }) */
}

SmashBot.prototype._onMessage = function(message) {
    if (this._isMentioningMe(message)) {
        this._executeCommand(message);
    }
}

// check if message is a message event and if the first word is smashbot
SmashBot.prototype._isMentioningMe = function(message) {
    return message.type === 'message' && /^smashbot\b/i.test(message.text);
}

// parses command passed to Smashbot and makes an object of the command and users passed
SmashBot.prototype._parseCommand = function(message) {
    var parse = message.text.match(/^smashbot\s(\w+)\s?(.+)?/i);
    console.log(parse);
    return {
        text: parse ? parse[1] : '',
        users: parse && parse[2] ? parse[2].split(/\W/).filter(s => s) : []
    }
}

SmashBot.prototype._executeCommand = function(message) {
    message.command = this._parseCommand(message);
    message.channel = this._getChannelById(message.channel);
    console.log(message.command);


    if (this.commands[message.command.text.toLowerCase()]) {

        this.commands[message.command.text.toLowerCase()].call(this, message)

    } else {

        // This is just a DRY function to reply to same channel.
        // Note arrow function lexically binds 'this' :)

        var reply = (text) => {
            this.postMessageToChannel(message.channel.name, text, {
                as_user: true
            });
        }

        switch (message.command.text.toLowerCase()) {
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

delete: Delete an open tournament if one exists\`\`\``, {
                as_user: true
            })
    },

    create: function(message) {
        api_util.createTourney()
            .then(response => {

                // console.log(response);
                this.postMessageToChannel(message.channel.name,
                    `Okay. Started a new tournament. \n See it live here: ${response.tournament.full_challonge_url} \nClick here to sign up:`, {
                        as_user: true
                    })
            })
            .catch(err => {
                console.log(err);
                console.log('error dammit');
            })
    },

    add: function(message) {

        api_util.getCurrentTourney()
            .then(res => {
                if (!res.length) {
                    this.postMessageToChannel(message.channel.name, `No open tournament right now tho. Open a new one with \`smashbot create\` first`, {
                        as_user: true
                    })
                } else {

                    message.command.users = message.command.users.map(s => {
                      if(s.toLowerCase() === 'me') {
                        var user = this._getUserById(message.user);
                        console.log(user, 'THISDD ASHDHDH USER');
                        return user.real_name ? user.real_name.split(' ')[0] : user.name;
                      } else {
                        return s;
                      }
                      });
                      console.log(message.command.users, 'user arr');
                    api_util.addPlayers(res[0].tournament.id, message.command.users)
                        .then(done => {
                          var userStr = message.command.users;

                          if(userStr.length > 1) {
                            userStr.splice(-1,0,'and');
                          }

                          userStr = userStr.map(s => s.capCase()).join(', ');

                            this.postMessageToChannel(message.channel.name, `Okey dokey, I added ${userStr}.`, {as_user: true});
                        })
                        .catch((response, body) => {
                                                    console.log('error adding players', response, body);
                          if(response.statusCode == 422) {
                            this.postMessageToChannel(message.channel.name, response.body.errors, {as_user:true})
                          }

                        })

                }
            })
            .catch(err => {
                this.postMessageToChannel(message.channel.name, `error :(  ${err})`, {
                    as_user: true
                });
            })
    },
    // No open tournament right now tho. Open a new one with \`smashbot tournament\` first
    status: function(message) {

        api_util.getCurrentTourney()
            .then(res => {
                if (!res.length) {

                    this.postMessageToChannel(message.channel.name, `No open tournament right now tho. Open a new one with \`smashbot create\` first`, {
                        as_user: true
                    })

                } else {

                    api_util.getParticipants(res[0].tournament.id)
                        .then(result => {
                          console.log('trying');
                            var participantArray = [];

                            result.forEach(s => participantArray.push(s.participant.name));

                            var bracket_image = participantArray.length > 1 ? res[0].tournament.live_image_url : '_no image available yet_';

                            var participants = participantArray.length ? "```" + participantArray.sort().join('\n') + "```" : "_none yet_";

                            webshot(bracket_image, 'test.png',  err => {
// {shotSize: {height: 'all', width: 'all'}},

                              // TODO: Slack will not expand svg previews. Try to convert SVG to PNG using https://github.com/domenic/svg2png?
                              this.postMessageToChannel(message.channel.name, "Here's the current tournament: " + res[0].tournament.full_challonge_url + "\n" +
                                                                              "Bracket Tree: " + bracket_image + "\n" +
                                                                              "Currently signed up: \n" + participants,
                                                                              {as_user: true});
                            });

                        })
                        .catch(err => console.log('error getting staatus'))
                }
            })
            .catch(err => console.log('error getting status'))
    },

    delete: function(message) {
        api_util.deleteTourney()
            .then(response => {
                this.postMessageToChannel(message.channel.name, `okay i deleted it`, {
                    as_user: true
                });
            })
            .catch(err => {
                this.postMessageToChannel(message.channel.name, `there wasn't an open tournament man`, {as_user: true});
            })
    }

}


module.exports = SmashBot;
