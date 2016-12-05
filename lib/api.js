'use strict';

require('dotenv').config();
var request = require('request');

require('./api-errors')();


// putting stuff on basic object prototypes is soooooo goood
String.prototype.capCase = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

// var url = 'https://api.challonge.com/v1/';

var Options = {
    auth: {
        user: 'TapQA',
        pass: process.env.CHALLONGE_KEY,
        sendImmediately: true
    },
    json: true,
    baseUrl: 'https://api.challonge.com/v1/'
}

// Set defaults for http requests.
var request = request.defaults(Options);

// Make a random hash for the URL.
function randomHash() {
    return Math.random().toString(36).replace(/[^a-z0-9]+/g, '').substr(0, 8);
}

// freeze options so we don't accidentally change stuff
Object.freeze(Options);


function _api(url, method) {
  return new Promise(function(resolve, reject) {

    if(method === undefined) method = 'GET';

    request({url: url, method: method}, function(error, response, body) {
      // I don't think there's a situation where there is Error on the response and the response code is 200. I'll leave it in here to remain robust.
      if(response.statusCode !== 200) {

        reject(new ApiError('Error: Recieved response code of ' + response.statusCode, response.statusCode, response.body));
      } else if(error) {

        reject(new ApiError('Error with Challonge API response', error));
      } else {
        // console.log(body, 'body @ _api');
        resolve(response)
      }
    })
  })
}

//[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]


var api_util = {

    getTourneys: function() {
        return new Promise(function(resolve, reject) {
            _api('tournaments.json')
              .then(response => {
                resolve(response.body)
              })
              .catch(err => reject(err));
        })
    },

    getParticipants: function(tournamentId) {
        return new Promise(function(resolve, reject) {

            _api(`tournaments/${tournamentId}/participants.json`)
              .then(response => resolve(response.body))
              .catch(err => reject(err))
        });
    },

    getCurrentTourney: function() {
        var self = this;
        return new Promise(function(resolve, reject) {

            self.getTourneys()
                .then((res) => {
                    var cry = res.length;
                    var result = !cry ? null : res.filter(s => s.tournament.state === 'pending' || s.tournament.state === 'underway');
                    console.log('result', result);
                    resolve(result)
                })
                .catch(err => reject(err))
          });
    },

    createTourney: function() {
        var self = this;
        return new Promise(function(resolve, reject) {

            self.getCurrentTourney()
                .then(res => {

                    if (res.length) reject(new TournamentError({exists: true}));

                    submitTourney()
                })
                .catch(err => reject(err))



            function submitTourney() {
                console.log('submit');
                var tournament = {
                    name: `TAP SMASH ${new Date().toLocaleString()}`,
                    description: `Tap QA Smash Bros tourney for ${new Date()}`
                }


                var uriString = `tournaments.json?tournament[name]=${tournament.name}&tournament[url]=${randomHash()}&tournament[description]=${tournament.description}&tournament[hold_third_place_match]=true&tournament[game_id]=20988&tournament[quick_advance]=true`;
                _api(uriString, 'POST')
                  .then((response) => resolve(response.body))
                  .catch(err => reject(err));

            }
        })

    },

    deleteTourney: function() {
        var self = this;
        return new Promise(function(resolve, reject) {

            self.getCurrentTourney()
                // reject if no current tournament
                .then(res => {
                    if (!res.length) {
                      reject(new TournamentError({exists: false}))
                    } else {

                        var urlString = `tournaments/${res[0].tournament.id}.json`
                        _api(urlString, 'delete')
                            .then((response) => resolve(response.body))
                            .catch(err => reject(err));
                    }
                })
                .catch(err => {
                    console.log('caught here', err);
                    reject(err)
                })
        })
    },

    addPlayers: function(tournamentId, userArray) {
        var self = this;
        return new Promise(function(resolve, reject) {

            /// TODO: custom error handling for when trying to add players that already exist

            var parameterString = `tournaments/${tournamentId}/participants/bulk_add.json?`;
            userArray.forEach((s, i) => parameterString += `participants[][name]=${s.capCase()}${i < userArray.length - 1 ? '&' : ''}`)
                // parameterString.replace(/&$/gi, '');
            console.log('param string', parameterString);


            _api(parameterString, 'post')
              .then((response) => resolve(response))
              .catch(err => {
                reject(err)
              })


            // TODO: API docs does not say how to format multiples....repeat parameter, array, object?

        })
    },

    shufflePlayers: function(tournamentId) {
      return new Promise(function(resolve, reject) {

        var uriString = `tournaments/${tournamentId}/participants/randomize.json`;

        _api(uriString, 'post')
          .then((response) => resolve(response))
          .catch(err => reject(err))
      });
    },

    beginTournament: function(tournamentId) {
      return new Promise(function(resolve, reject) {

        var uriString = `tournaments/${tournamentId}/start.json`

        _api(uriString, 'post')
          .then((response) => resolve(response))
          .catch(err => reject(err))
      })
    }

}

//api_util.createTourney().then(s => console.log('s', s)).catch(s => console.log(`sorry. Tournament ${s[0].tournament.name} is already underway. Please finish it up and try again`))



module.exports = api_util;
