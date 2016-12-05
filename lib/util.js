'use strict';
var util = {
  // utility function to help with template literal indentation.
  dedent: function(callSite, ...args) {

      function format(str) {
          let size = -1;

          return str.replace(/\n(\s+)/g, (m, m1) => {

              if (size < 0)
                  size = m1.replace(/\t/g, "    ").length;

              return "\n" + m1.slice(Math.min(m1.length, size));
          });
      }

      if (typeof callSite === "string")
          return format(callSite);

      if (typeof callSite === "function")
          return (...args) => format(callSite(...args));

      let output = callSite
          .slice(0, args.length + 1)
          .map((text, i) => (i === 0 ? "" : args[i - 1]) + text)
          .join("");

      return format(output);
  },
  //takes an array and just picks a rondom result
  // If array item chosen is a function, calls the function.
  pickRandom: function(array) {
    var chosenOne = array[Math.floor(Math.random() * array.length)];
    if( typeof chosenOne === 'function') {
      return chosenOne();
    } else {
      return chosenOne;
    }
  }


};



module.exports = util;
