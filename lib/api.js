'use strict';
//core

//npm
require('dotenv').config();
var request = require('request');
var _ = require('lodash');
// custom
require('./api-errors')();
var util = require('./util');



// default options for npm.request
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

// freeze options so we don't accidentally change stuff
Object.freeze(Options);


function _api(url, method) {
    return new Promise(function(resolve, reject) {

        if (method === undefined) method = 'GET';

        request({
            url: url,
            method: method
        }, function(error, response, body) {
            // I don't think there's a situation where there is Error on the response and the response code is 200. I'll leave it in here to remain robust.
            if (response.statusCode !== 200) {

                reject(new ApiError(`Error: Recieved response code of ${response.statusCode}`, response.statusCode, response.body));
            } else if (error) {

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
        var _this = this;
        return new Promise(function(resolve, reject) {

            _this.getTourneys()
                .then((res) => {
                    var cry = res.length;
                    var result = !cry
                        ? null
                        : res.filter(s => s.tournament.state === 'pending' || s.tournament.state === 'underway');
                    resolve(result)
                })
                .catch(err => reject(err))
        });
    },

    createTourney: function() {
        var _this = this;
        return new Promise(function(resolve, reject) {

            _this.getCurrentTourney()
                .then(res => {

                    if (res.length) reject(new TournamentError({
                        exists: true
                    }));

                    submitTourney()
                })
                .catch(err => reject(err))


            function submitTourney() {

                var tournament = {
                    name: `TAP SMASH ${new Date().toLocaleString()}`,
                    description: `Tap QA Smash Bros tourney for ${new Date()}`
                }

                // this URI string is a doozy, but it's mostly for static settings. Forgive the enormous line.
                var uriString = `tournaments.json?tournament[name]=${tournament.name}&tournament[url]=${util.randomHash()}&tournament[description]=${tournament.description}&tournament[hold_third_place_match]=true&tournament[game_id]=20988&tournament[quick_advance]=true`;
                _api(uriString, 'POST')
                    .then((response) => resolve(response.body))
                    .catch(err => reject(err));

            }
        })

    },

    deleteTourney: function() {
        var _this = this;
        return new Promise(function(resolve, reject) {

            _this.getCurrentTourney()
                // reject if no current tournament
                .then(res => {
                    if (!res.length) {
                        reject(new TournamentError({
                            exists: false
                        }))
                    } else {

                        var urlString = `tournaments/${res[0].tournament.id}.json`;
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
        var _this = this;
        return new Promise(function(resolve, reject) {

            var parameterString = `tournaments/${tournamentId}/participants/bulk_add.json?`;

            //add to parameterString one request for each user being added
            userArray.forEach((s, i) => parameterString += `participants[][name]=${_.capitalize(s)}${i < userArray.length - 1 ? '&' : ''}`)

            _api(parameterString, 'post')
                .then((response) => resolve(response))
                .catch(err => {
                    reject(err)
                })

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
    },

    removePlayer: function(player) {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.getCurrentTourney()
                .then((res) => {
                    if (!res.length) {
                        reject(new TournamentError({
                            exists: false
                        }))
                    } else {

                        findPlayer(res[0].tournament.id, player);
                    }
                })
                .catch(err => reject(err));

            var findPlayer = function(tournamentId, player) {

                _this.getParticipants(tournamentId)
                    .then(playerList => {

                      var found = playerList.find(s => s.participant.name.toLowerCase() === player.toLowerCase());


                      if(found === undefined) {
                        // console.log(found);
                        return reject(new ApiError(`Error: Participant ${player} was not found`, 422,
                           {errors: [`Error: Couldn't find ${_.capitalize(player)} in the current tournament.`]})
                         )
                      }

                      var participantId = found.participant.id;

                      var uriString = `tournaments/${tournamentId}/participants/${participantId}.json`
                      _api(uriString, 'DELETE')
                        .then(res => resolve(res.body))
                        .catch(err => reject(err))
                    })
                    .catch(err => reject(err))
            }

        })

    }
}





module.exports = api_util;
