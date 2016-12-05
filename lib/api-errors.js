/* Hi. Are you here to judge me? Well you probably should. This is terrible.
 Listen, I wanted to use this project as a way to learn a lot of ES6 features
 as well as cheeky tricks to really understand Node under the hood.
 And look, that's what I'm doing. I could have done this easier without using strict mode,
but then I couldn't use classes. And I could have stuck each of these on exports, but
then it would be messy requiring it. I wanted to see if this would work. It did. Go away
 */
'use strict';

// this class essentially makes Error object extendable
class ExtendableError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}

class ApiError extends ExtendableError {
  constructor(text, status, body) {
    super(text);
    this.status = status;
    this.body = body;
    }
  }

class TournamentError extends ExtendableError {
  constructor(params) {
    super();
    if(params === undefined) params = {};
    // default to true
    this.exists = !!params.exists
  }
}


var unpacker = function() {
  var arr = [ApiError, TournamentError];
  arr.forEach(s => global[s.name] = s);
}


module.exports = unpacker;
