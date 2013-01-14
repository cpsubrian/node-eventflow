EventFlow
=========

Flow control for your event emitters.

[![build status](https://secure.travis-ci.org/cpsubrian/node-eventflow.png)](http://travis-ci.org/cpsubrian/node-eventflow)

About
-----

EventEmitters are an important part of well-designed node.js applications.
`on()` and `emit()` can get you pretty far, but wouldn't it be great if you
could run your event handlers asynchronously, with a continuation callback?

**EventFlow** adds the flow-controlly-goodness of
[async](https://github.com/caolan/async) to your event emitters.

Usage
-----

### Creating an EventFlow emitter

Create a new emitter.

```js
var emitter = require('eventflow')();
```

Or, extend an existing emitter with EventFlow functionality.

```js
var EventEmitter = require('events').EventEmitter,
    emitter = new EventEmitter();

require('eventflow')(emitter);
```

Or, extend an EventEmitter class with EventFlow functionality.

```js
var EventEmitter = require('events').EventEmitter,
    require('eventflow')(EventEmitter),
    emitter = new EventEmitter();
```

Or, convert any object into an EventFlow emitter.

```js
var emitter = {
  type: 'car',
  name: 'Honda'
};
require('eventflow')(emitter);
```

### Listen

Listen for some events, with or without continuation callbacks. EventFlow does
some simple introspection of your listeners to see if they accept a callback
or not.

```js
emitter.on('foo', function() {
  // Do something synchronous
});

emitter.on('foo', function(callback) {
  doSomethingAsync(function(bar) {
    callback();
  });
});
```

### Invoke listeners

Now use one of the flow control methods to invoke your handlers and respond
when they are done.

**series**

```js
emitter.series('foo', function() {
  // The listeners ran in the order they were added and are all finished.
});
```

**parallel**

```js
emitter.parallel('foo', function() {
  // The listeners ran in parallel and are all finished.
});
```

Errors
------

In synchronous listeners, you can return `Error` objects.

```js
emitter.on('foo', function () {
  return new Error('Something broke');
});
```

In async listeners, you should pass an `Error` as the first argument to the
callback.

```js
emitter.on('foo', function (cb) {
  cb(new Error('Something broke'));
});
```

No matter whether your listeners are sync or async, Errors will always be
passed back as the first argument in the callback of the invocation.

```js
emitter.series('foo', function (err) {
  // `err` is the first error encountered.
});
```

Advanced
--------

**Event listeners with arguments**

EventFlow supports calling your listeners with any number of arguments, as well
as the optional continuation callback.

```js
// In your logger or something:
emitter.on('purchase', function(name, item, cost) {
  console.log(name + ' just bought ' + item + ' for ' + cost);
})

// Somwhere else in your code:
emitter.on('purchase', function(name, item, cost, callback) {
  saveToDB({name: name, item: item, cost: cost}, callback);
});

// Perhaps in a form POST handler:
emitter.series('purchase', 'Brian', 'T-Shirt', '$15.00', function() {
  // The purchase was logged and saved to the db.
});
```

**Using async-style `callback(err, results)`**

EventFlow uses async directly to handle the flow-control, so you can use `err`
and `results` just like you already do.

```js
// Synchronous listeners can return a result.
emitter.on('fruit', function() {
  return 'apple';
});

// Async listeners use the standard (err, result) callback.
emitter.on('fruit', function(callback) {
  callback(null, 'orange');
});

emitter.series('fruit', function(err, results) {
  console.log(results);
  // [ 'apple', 'orange' ]
});
```

Waterfall
---------

The waterfall method allows listeners to modify a variable in a series. The
first listener receives an initial value, and each subsequent listener modifies
the return of the last listener:

```js
emitter.on('foo', function(n) {
  // sync task
  return n + 1;
});
emitter.on('foo', function(n, callback) {
  // async task
  cb(null, n * 3);
});
emitter.waterfall('foo', 2, function(err, n) {
  // n = 9
});
```

Invoke
------

EventFlow also attaches the method `emitter.invoke(event, [args...], callback)`.
Invoke executes using the following rules:

1. There must be EXACTLY one listener for the event. Otherwise the callback
   is called with an error.
2. The listener can `return` a value and if so, callback is called with `callback(err, value)`.
3. The listener can accept a continuation callback and if so, that function should
   be called with `(err, [value])`.

Think of 'invoke' as in-app RPC via an EventEmitter. Instead of passing
functions around your app in `options` objects, you can invoke them instead.

**Example**

```js
emitter.on('add', function(a, b) {
  return a + b;
});
emitter.invoke('add', 1, 2, function(err, value) {
  console.log(value);
  // 3
});


emitter.on('subtract', function(a, b, callback) {
  callback(null, a - b);
});
emitter.invoke('subtract', 3, 2, function(err, value) {
  console.log(value);
  // 1
});
```

Example Use Case: Model API
---------------------------

Lets say you are designing a simple model api around redis (or whatever db you
use). It has the following API:

```js
function Model () {
  // Constructor stuff.
}
Model.prototype = {
  load: function (id, cb) {
    // Load a model from the db.
  },
  save: function (cb) {
    // Save the model.
  }
}
module.exports = Model;
```

You know your app will need to support validation, but you dont want
this Model module to include any of the app-specific validation logic. Using
EventFlow, you could just use a 'validate' event to abstract it away.

```js
var eventflow = require('eventflow');

function Model () {
  // Constructor stuff.
}

eventflow(Model);

Model.prototype = {
  load: function (id, cb) {
    // Load a model from the db.
  },
  save: function (cb) {
    Model.parallel('validate', this, function (err) {
      if (err) {
        // There was an error validating the model or it was invalid.
        return cb(err);
      }
      else {
        // Save the model and eventually call `cb(null)`.
      }
    });
  }
}

module.exports = Model;
```

Now your app could do something like the following:

```js
var Model = require('./path/to/model');

// Simple validation.
Model.on('validate', function (model) {
  if (model.title.length > 50) {
    return new Error('Titles should be 50 chars or less.');
  }
});

// Async validation that hits a db or something.
Model.on('validate', function (model, cb) {
  Model.load(model.id, function (err, model) {
    if (err) return cb(err);
    if (model) return cb(new Error('A model already exists for this id.'));
    cb(null);
  });
});

var thing = new Model();
thing.save(function (err) {
  // Validation errors would appear here.
});
```

- - -

### Developed by [Terra Eclipse](http://www.terraeclipse.com)
Terra Eclipse, Inc. is a nationally recognized political technology and
strategy firm located in Aptos, CA and Washington, D.C.

- - -

### License: MIT
Copyright (C) 2012 Terra Eclipse, Inc. ([http://www.terraeclipse.com](http://www.terraeclipse.com))

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.