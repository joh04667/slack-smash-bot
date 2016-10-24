require('dotenv').config();
var request = require('request');

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

var api_util = {

    getTourneys: function() {
        return new Promise(function(resolve, reject) {

            request({url: 'tournaments.json'}, function(error, response, body) {
                error || response.statusCode !== 200 ? reject(error, body) : resolve(body);
            })
        })
    },

    getParticipants: function(tournamentId) {
        return new Promise(function(resolve, reject) {

            request({url: `tournaments/${tournamentId}/participants.json`}, function(error, response, body) {
                console.log(body);
                error || response.statusCode !== 200 ? reject(error, body) : resolve(body);
            });
        })
    },

        getCurrentTourney: function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            // console.log(this);
            self.getTourneys()
                .then(res => {

                    // console.log(res);
                    var result = !res ? null : res.filter(s => s.tournament.state === 'pending' || s.tournament.state === 'underway');
                    // console.log(result);
                    resolve(result);
                })
                .catch(err => {
                    console.log('error at getcurrent', err);
                    reject(err);
                });
        })
    },

    createTourney: function() {
        var self = this;
        return new Promise(function(resolve, reject) {

            self.getCurrentTourney()
                .then(res => {
                    console.log(res, 'res');
                    res.length ? reject(res) : submitTourney()
                })
                .catch(s => reject(s))



            function submitTourney() {
                console.log('submit');
                var tournament = {
                    name: `TAP SMASH ${new Date().toLocaleString()}`,
                    description: `Tap QA Smash Bros tourney for ${new Date()}`
                }

                // var options = Object.assign({
                //   uri: url + `tournaments.json?tournament[name]=${tournament.name}&tournament[url]=${randomHash()}&tournament[description]=${tournament.description}&tournament[hold_third_place_match]=true&tournament[game_id]=20988&tournament[quick_advance]=true`,
                //   method: 'POST'
                //   }, Options);



                request.post({
                    url: `tournaments.json?tournament[name]=${tournament.name}&tournament[url]=${randomHash()}&tournament[description]=${tournament.description}&tournament[hold_third_place_match]=true&tournament[game_id]=20988&tournament[quick_advance]=true`
                }, function(error, response, body) {

                    if (error) {
                        reject(error)
                    }
                    response.statusCode == 200 ? resolve(body) : reject(body);
                })
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
                        console.log('!!!!');
                        reject(res);
                    } else {

                        // var options = Object.assign({
                        //   uri: url + `tournaments/${res[0].tournament.id}.json`,
                        //   method: 'DELETE'
                        //   }, Options);

                        request.delete({url: `tournaments/${res[0].tournament.id}.json`}, function(error, response, body) {

                            if (error) {
                                reject(error)
                            }

                            response.statusCode == 200 ? resolve(body) : reject(body);
                        })
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



            var parameterString = `tournaments/${tournamentId}/participants/bulk_add.json?`;
            userArray.forEach((s,i) => parameterString += `participants[][name]=${s.capCase()}${i < userArray.length - 1 ? '&' : ''}`)
            // parameterString.replace(/&$/gi, '');


            console.log('param string', parameterString);

            // TODO: API docs does not say how to format multiples....repeat parameter, array, object?
            request.post({
                url: parameterString
            }, function(error, response, body) {
              console.log(response.statusCode, 'status', body);
                error || response.statusCode !== 200 ? reject(error, body) : resolve(body);
            })



        })
    }

}

//api_util.createTourney().then(s => console.log('s', s)).catch(s => console.log(`sorry. Tournament ${s[0].tournament.name} is already underway. Please finish it up and try again`))



module.exports = api_util;
