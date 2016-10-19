require('dotenv').config();
var request = require('request');


var url = 'https://api.challonge.com/v1/';

var options = {
  auth: {
    user: 'TapQA',
    pass: process.env.CHALLONGE_KEY,
    sendImmediately: true
  },
  json: true,
  uri: url
}

var api_util = {

  getTourneys: function() {
    return new Promise(function(resolve, reject) {
      options.uri += 'tournamentss.json';

        request(options, function(error, response, body) {
          // console.log(body);

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
          console.log(res);
          var result = !res ? null : res.filter(s => s.tournament.state === 'pending' || s.tournament.state === 'in_progress');
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    })
  },

  createTourney: function() {
    var self = this;
    options.uri += 'tournaments.json';



    function submitTourney() {
      var tournament = {
        name: new Date().toLocaleString(),
        description: `Smash Bros tourney for ${new Date()}`
      }
    }

  }

}

api_util.createTourney()

module.exports = api_util;
