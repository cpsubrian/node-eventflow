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

  // 'Invoke' an event, only calling the handler if there is EXACTLY one
  // listener.
  eventEmitter.invoke = function () {
    var emitter = this,
        args = Array.prototype.slice.call(arguments),
        name = args.shift(),
        callback = args.pop(),
        listeners = emitter.listeners(name);

    if (!listeners.length) {
      callback(new Error('Tried to invoke `' + name + '` but there were no listeners'));
    }
    else if (listeners.length > 1) {
      callback(new Error('Tried to invoke `' + name + '` but there were ' + listeners.length + ' listners'));
    }
    else {
      asyncApply(emitter, listeners.pop(), args, callback);
    }
  };
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

function asyncApply (thisArg, fn, args, done) {
  var count = countArgs(fn);
  if (count <= args.length) {
    done(null, fn.apply(thisArg, args));
  }
  else {
    fn.apply(thisArg, args.slice(0).concat([done]));
  }
}

function mapHandlers (emitter, name, args) {
  return emitter.listeners(name).map(function (listener) {
    return asyncApply.bind(emitter, emitter, listener, args);
  });
}