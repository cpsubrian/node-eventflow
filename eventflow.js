var async = require('async');

var eventflow = module.exports = function eventflow (eventEmitter) {
  // We were passed a 'class'.
  if (eventEmitter.prototype && eventEmitter.prototype.on) {
    eventEmitter = eventEmitter.prototype;
  }

  // Attach async methods.
  ['series', 'parallel'].forEach(function(method) {
    eventEmitter[method] = function () {
      var emitter = this,
          args = Array.prototype.slice.call(arguments),
          name = args.shift(),
          callback = args.pop(),
          tasks = mapHandlers(emitter, name, args);

      async[method](tasks, callback);
    };
  });
};

function countArgs (fn) {
  var regex = /function(?:\s+\w+\s*|\s*)\(([^\)]*)\)/i;
  var args = fn.toString().match(regex)[1].trim();
  if (args.length) {
    return args.split(',').length;
  }
  else {
    return 0;
  }
}
eventflow.countArgs = countArgs;

function mapHandlers (emitter, name, args) {
  return emitter.listeners(name).map(function (listener) {
    return function (done) {
      var count = countArgs(listener),
          handlerArgs = args.slice(0),
          result = null;

      if (count <= args.length) {
        result = listener.apply(emitter, handlerArgs);
        done(null, result);
      }
      else {
        handlerArgs.push(done);
        listener.apply(emitter, handlerArgs);
      }
    };
  });
}