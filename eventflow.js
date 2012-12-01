var async = require('async'),
    EventEmitter = require('events').EventEmitter;

var eventflow = module.exports = function eventflow (eventEmitter) {
  // We were passed a 'class'.
  if (eventEmitter && eventEmitter.prototype && eventEmitter.prototype.on) {
    eventEmitter = eventEmitter.prototype;
  }
  else if (typeof eventEmitter === 'undefined') {
    eventEmitter = new EventEmitter;
  }

  // Attach async methods.
  ['series', 'parallel', 'waterfall'].forEach(function(method) {
    eventEmitter[method] = function () {
      var emitter = this,
          args = Array.prototype.slice.call(arguments),
          name = args.shift(),
          callback = args.pop(),
          tasks = mapHandlers(method, emitter, name, args);

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
      asyncApply(emitter, listeners[0], args, callback);
    }
  };

  return eventEmitter;
};

function asyncApply (thisArg, fn, args, done) {
  if (!Array.isArray(args)) args = [args];
  if (fn.length <= args.length) {
    done(null, fn.apply(thisArg, args));
  }
  else {
    fn.apply(thisArg, args.slice().concat(done));
  }
}

function mapHandlers (method, emitter, name, args) {
  return emitter.listeners(name).map(function (listener, idx) {
    if (method === 'waterfall' && idx > 0) {
      // For waterfall, args only need to be bound to the first task.
      return asyncApply.bind(emitter, emitter, listener);
    }
    return asyncApply.bind(emitter, emitter, listener, args);
  });
}