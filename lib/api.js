require('dotenv').config();
var request = require('request');


var url = 'https://api.challonge.com/v1/';

var Options = {
    auth: {
        user: 'TapQA',
        pass: process.env.CHALLONGE_KEY,
        sendImmediately: true
    },
    json: true,
}


function randomHash() {
  return Math.random().toString(36).replace(/[^a-z0-9]+/g, '').substr(0,8);
}

// freeze options so we don't accidentally change stuff
Object.freeze(Options);

var api_util = {

    getTourneys: function() {
        return new Promise(function(resolve, reject) {

            var options = Object.assign({uri: url + 'tournaments.json'}, Options);

            request(options, function(error, response, body) {
                console.log(error || response.statusCode !== 200);
                error || response.statusCode !== 200 ? reject(error) : resolve(body);
            })
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
                  console.log('error at getcurrent');
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

                var options = Object.assign({
                  uri: url + `tournaments.json?tournament[name]=${tournament.name}&tournament[url]=${randomHash()}&tournament[description]=${tournament.description}&tournament[hold_third_place_match]=true&tournament[game_id]=20988&tournament[quick_advance]=true`,
                  method: 'POST'
                  }, Options);



                request.post(options, function(error, response, body) {

                  if(error) {reject(error)}
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
            if(!res.length) {
              console.log('!!!!');
              reject(res);
            } else {
              
            var options = Object.assign({
              uri: url + `tournaments/${res[0].tournament.id}.json`,
              method: 'DELETE'
              }, Options);

            request.delete(options, function(error, response, body) {

              if(error) {reject(error)}

              response.statusCode == 200 ? resolve(body) : reject(body);
            })
          }
          })
          .catch(err => {
            console.log('caught here', err);
            reject(err)
          })
      })
    }

}

//api_util.createTourney().then(s => console.log('s', s)).catch(s => console.log(`sorry. Tournament ${s[0].tournament.name} is already underway. Please finish it up and try again`))



module.exports = api_util;
