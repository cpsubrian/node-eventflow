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
Attach eventflow to your event emitter:

```js
var EventEmitter = require('events').EventEmitter,
    require('eventflow')(EventEmitter),
    emitter = new EventEmitter();
```

Or, if you prefer not to extend the prototype:

```js
var EventEmitter = require('events').EventEmitter,
    emitter = new EventEmitter();

require('eventflow')(emitter);
```

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

Invoke
------
EventFlow also exposes the method `emitter.invoke(event, [args...], callback)`.
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