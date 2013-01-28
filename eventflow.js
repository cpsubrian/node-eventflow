var async = require('async'),
    EventEmitter = require('events').EventEmitter;

var eventflow = module.exports = function eventflow (eventEmitter) {
  if (typeof eventEmitter === 'undefined') {
    eventEmitter = new EventEmitter();
  }
  else if (eventEmitter.prototype && eventEmitter.prototype.on) {
    eventEmitter = eventEmitter.prototype;
  }
  else if (!eventEmitter.on) {
    var tempEmitter = new EventEmitter();
    Object.keys(tempEmitter).forEach(function (prop) {
      if (typeof eventEmitter[prop] !== 'undefined') {
        throw new Error('Conflict converting obj to eventflow emitter on property`' + prop + '`');
      }
      eventEmitter[prop] = tempEmitter[prop];
    });
    Object.keys(EventEmitter.prototype).forEach(function (method) {
      if (typeof eventEmitter[method] !== 'undefined') {
        throw new Error('Conflict converting obj to eventflow emitter on method`' + method + '`');
      }
      eventEmitter[method] = tempEmitter[method];
    });
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
        callback = typeof args[args.length -1] === 'function' ? args.pop() : null,
        listeners = emitter.listeners(name);

    function handleError (err) {
      if (callback) {
        callback(err);
      }
      else {
        throw err;
      }
    }

    if (!listeners.length) {
      handleError(new Error('Tried to invoke `' + name + '` but there were no listeners'));
    }
    else if (listeners.length > 1) {
      handleError(new Error('Tried to invoke `' + name + '` but there were ' + listeners.length + ' listners'));
    }
    else {
      if (callback) {
        asyncApply(emitter, handleOnce(emitter, name, listeners[0]), args, callback);
      }
      else {
        return handleOnce(emitter, name, listeners[0]).apply(emitter, args);
      }
    }
  };

  return eventEmitter;
};

function asyncApply (thisArg, fn, args, done) {
  if ('function' === typeof fn.removeWrapper) {
    fn.removeWrapper(); // remove the wrapper, as it would have removed itself
  }
  if (!Array.isArray(args)) args = [args];
  if (fn.length <= args.length) {
    var result = fn.apply(thisArg, args);
    if (result instanceof Error) {
      done(result);
    }
    else {
      done(null, result);
    }
  }
  else {
    fn.apply(thisArg, args.slice().concat(done));
  }
}

function mapHandlers (method, emitter, name, args) {
  return emitter.listeners(name).map(function (listener, idx) {
    if (method === 'waterfall' && idx > 0) {
      // For waterfall, args only need to be bound to the first task.
      return asyncApply.bind(emitter, emitter, handleOnce(emitter, name, listener));
    }
    return asyncApply.bind(emitter, emitter, handleOnce(emitter, name, listener), args);
  });
}

/**
 * Allow (and honor) emitter.once('foo', ...)
 * See:
 * EventEmitter.prototype.once
 * https://github.com/joyent/node/blob/master/lib/events.js#L184-L199
 */
function handleOnce (emitter, name, listener) {
  // A .once listener is actually a wrapper that has the original listener attached
  // If there is no such property, it's a normal .on listener -- proceed as normal
  if (typeof listener.listener !== 'function') return listener;
  var origlistener = listener.listener;
  origlistener.removeWrapper = emitter.removeListener.bind(emitter, name, listener); // save this removal function for execution time
  return origlistener; // apply to the original listener; note that since the .once wrapper
                       // was removed, it won't get invoked again
}