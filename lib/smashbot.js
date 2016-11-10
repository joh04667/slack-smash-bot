'use strict';

var path = require('path');
var fs = require('fs');
var Bot = require('slackbots');
var api_util = require('./api');
var webshot = require('webshot');
var extend = require('extend');
var path = require('path')
var request = require('request')


function pickRandom(array) {
  var chosenOne = array[Math.floor(Math.random() * array.length)];
  if( typeof chosenOne === 'function') {
    return chosenOne();
  } else {
    return chosenOne;
  }
};



class SmashBot extends Bot {
    constructor(settings) {
      super(settings);
      this.settings = settings;
      this.settings.name = this.settings.name || 'smashbot';
      // this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'smashbot.db');
      this.owner = settings.owner;
      this.user = null;
      this.db = null;
    }

    _getChannelById(channelId) {
      return this.channels.find(s => s.id === channelId);
    };

    _getUserById(userId) {
        return this.users.find(s => s.id === userId);
    };
    // homebrewed another method for file uploads
    _apiForm(methodName, params) {

      params.file = fs.createReadStream(params.file);
      params.token = this.token;

        var data = {
            url: 'https://slack.com/api/' + methodName,
            formData: params // this._preprocessParams(params)
        };

        return new Promise(function(resolve, reject) {

            request.post(data, function(err, request, body) {
                if (err) {
                    reject(err);
                    return false;
                }
                try {
                    body = JSON.parse(body);
                    // Response always contain a top-level boolean property ok,
                    // indicating success or failure
                    if (body.ok) {
                        resolve(body);
                    } else {
                        reject(body);
                    }

                } catch (e) {
                    reject(e);
                }
            });
        });
    };
};


SmashBot.prototype.run = function() {
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
    //this.channelList.forEach(s => {
      // this.postMessageToChannel(this.channelList[0].name, 'shut up Scott', {as_user: true});
    //})
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


SmashBot.prototype._preprocessMessage = function(message) {
    message.command = this._parseCommand(message);
    message.channel = this._getChannelById(message.channel);

    message._reply = (text) => {
      this.postMessageToChannel(message.channel.name, text, {as_user: true})
    }
}


SmashBot.prototype._executeCommand = function(message) {
    this._preprocessMessage(message);

    console.log(message.command);

    if (this.commands[message.command.text.toLowerCase()]) {
        this.commands[message.command.text.toLowerCase()].call(this, message)

    } else {

        var reply = message._reply;

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
            case 'sucks':
            case 'suck':
                var insults = [
                  "1v1 me u skrub final destination i'll rek u",
                  "U WOT M8",
                  "stfu nerd u suck",
                  "I may be fake, but my feelings are real :(",
                  "http://i.imgur.com/ixfC5t7.jpg"
                ];
                reply(pickRandom(insults));
                break;


            default:

                reply(`I don't know that command`);
        }
    }
}

//TODO: Just a big old TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO
// Change the error handling of the project. Make a new object with errors and semantic reasoning. Refactor
SmashBot.prototype._errorHandle = function(message, error) {
  console.log(error, 'handled by handler');

    // if() {
    //   message._reply(`There's already a tournament open. Finish it or destroy it first.`);
    //   //TODO HERE continue creating error objects
    // } else {
    //   message._reply(`there is no tournament open yet`);
    // }


    switch (error.name) {
      case 'ApiError':
        message._reply(`There was a problem connecting to Challonge. I've messaged Kyle about it.`)
        this.postMessageToUser(this.owner, 'got an error for you.\n' + '```' + error.toString() + '```')
        break;
      case 'TournamentError':
        let text = error.exists ? 'A tournament is already underway. Destroy it or finish it first.' : 'There isn\'t a tournament open yet. Start one with `smashbot create`.';
        message._reply(text)
        break;
      default:
        message._reply('...um, I had a little accident. I messaged Kyle to come fix me. sorry :(')
        this.postMessageToUser(this.owner, 'got an error for you.\n' + '```' + error.toString() + '```')
        break;
    }
};



SmashBot.prototype.commands = {
    help: function(message) {

var helpText = `Here's how to tell me what to do:

\`\`\`Type 'smashbot' then.....

help: get this message (duh)

create: open a new tournament for people to join (only 1 can be open at a time)

add me: Add yourself to the current tournament.

add player1, player2... : Add players to the current tournament (either separate with spaces or commas, you can also replace your own name with 'me')

remove me, player1, player2... : Remove players from the tree.

status: Get an overview of the current tournament and list of players signed up

tree: view the current status of the tournament tree (takes a couple seconds, I have to do a lot of work for that one)

shuffle: Randomizes the tournament seed.

start: Starts the current tournament!

destroy: Delete an open tournament if one exists\`\`\``

      message._reply(helpText);
    },

    create: function(message) {
        api_util.createTourney()
            .then(response => {

              message._reply( `Okay. Started a new tournament. \n See it live here: ${response.tournament.full_challonge_url} \nClick here to sign up:`)

            })
            .catch(err => this._errorHandle(message, err));
    },

    add: function(message) {

        api_util.getCurrentTourney()
            .then(res => {
                if (!res.length) {
                  this._errorHandle(message, res);
                } else {

                    message.command.users = message.command.users.map(s => {
                        if (s.toLowerCase() === 'me') {
                            var user = this._getUserById(message.user);
                            return user.real_name ? user.real_name.split(' ')[0] : user.name;
                        } else {
                            return s;
                        }
                    });

                    api_util.addPlayers(res[0].tournament.id, message.command.users)
                        .then(done => {
                            var userStr = message.command.users;

                            if (userStr.length > 1) {
                                userStr.splice(-1, 0, 'and');
                            }

                            userStr = userStr.map(s => s.capCase()).join(', ');

                            message._reply(`Okey dokey, I added ${userStr}.`)
                        })
                        .catch((response, body) => this._errorHandle(response, body))
                        // {
                        //     console.log('error adding players', response, body);
                        //     if (response.statusCode == 422) {
                        //         this.postMessageToChannel(message.channel.name, response.body.errors, {
                        //             as_user: true
                        //         })
                        //     }
                        //
                        // })

                }
            })
            .catch(err => this._errorHandle(err))
    },

    remove: function(message) {

      api_util.getCurrentTourney()
      .then(res => {

      })
      .catch(err => this._errorHandle(message, err));
    },

    // No open tournament right now tho. Open a new one with \`smashbot tournament\` first
    status: function(message) {

        api_util.getCurrentTourney()
            .then(res => {
                    if(!res) throw new TournamentError({exists: false});

                    api_util.getParticipants(res[0].tournament.id)
                        .then(result => {
                            var participantArray = [];

                            result.forEach(s => participantArray.push(s.participant.name));
                            var bracket_image = participantArray.length > 1 ? res[0].tournament.live_image_url : '_no image available yet_';
                            var participants = participantArray.length ? "```" + participantArray.sort().join('\n') + "```" : "_none yet_";

                            message._reply( "Here's the current tournament: " + res[0].tournament.full_challonge_url + "\n" +
                                    "Bracket Tree: " + bracket_image + "\n" +
                                    "Currently signed up: \n" + participants )


                        })
                        .catch(err => this._errorHandle(message, err))
            })
            .catch(err => this._errorHandle(message, err))
    },

    destroy: function(message) {
        api_util.deleteTourney()
            .then(message._reply(`okay i deleted it`))
            .catch(err => this._errorHandle(message, err))
    },

    tree: function(message) {

      api_util.getCurrentTourney()
        .then(response => {
          api_util.getParticipants(response[0].tournament.id)
            .then(participants => {

              var participantArray = [];

              participants.forEach(s => participantArray.push(s.participant.name));

              var bracket_image = participantArray.length > 1 ? response[0].tournament.live_image_url : null;

              if(!bracket_image) {
                message._reply("i need at least two people to make a bracket bro")
              } else {
                // homebrewed an option in Webshot that will append a background color of choice?
                // the challonge image url is only svg. no body to append to
                message._reply("ok, just a sec...")

                var options = {
                  renderDelay: 1000,
                  shotSize: {
                    defaultBackground: 'grey',
                    width: 'all',
                    height: 'all'
                  }
                };

                webshot(bracket_image, 'img/tree.png', options, err => {

                  this._uploadImage(message.channel.name, path.join(__dirname, '../img/tree.png'), {filename: 'Smash Tree'})

                })
              }
            })
            .catch(err => console.log(err))

        })
        .catch(err => this._errorHandle(message, err))


    },



    shuffle: function(message) {
      api_util.getCurrentTourney()
        .then(res => shufflePlayers(res[0].tournament.id))
        .catch(err => this._errorHandle(message, err)) //TODO error

        var shufflePlayers = (tournamentId) => {
          api_util.shufflePlayers(tournamentId)
            .then(message._reply('okaaaay, all shuffled up'))
            .catch(err => console.log(err))
        }
    },

    begin: function(message) {
      api_util.getCurrentTourney()
        .then(res => startTournament(res[0].tournament.id))
        .catch(err => this._errorHandle(err))

        var startTournament = (tournamentId) => {
          api_util.beginTournament(tournamentId)
            .then(message._reply('TIME TO SMAAAAAAAAAASH! \n (i started it)'))
            .catch(err => console.log(err))
        }
    }

}

// uploads a file to slack API. Uses homebrewed Slackbot method ._api, not defined here
SmashBot.prototype._uploadImage = function(channel, image, params) {

    params = extend({
        file: image,
        filename: 'img',
        channels: channel,
        username: this.name,
    }, params || {});

    return this._apiForm('files.upload', params)
      .then(res => console.log(res))
      .catch(err => console.log(err))
}


module.exports = SmashBot;
