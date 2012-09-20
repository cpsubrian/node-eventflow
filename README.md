EventFlow
=========

Flow control for your event emitters.


About
-----
EventEmitters are an important part of well-designed node.js applications.
`on()` and `emit()` can get you pretty far, but wouldn't it be great if you
could run your event handlers asynchronously, with a continuation callback.

**EventFlow** exposes the flow-controlly-goodness of
[async](https://github.com/caolan/async) for your event emitters.

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
  // Do something sychronous
});

emitter.on('foo', function(callback) {
  doSomethingAsync(function(bar) {
    callback();
  });
});
```

Now use one of the flow control methods to invoke your handlers and respond
when they are done.

```js
emitter.series('foo', function() {
  // The listeners ran in the order they were added and are all finished.
});
```

or

```js
emitter.parallel('foo', function() {
  // The listeners ran in parallel and are all finished.
});
```

Developed by [Terra Eclipse](http://www.terraeclipse.com)
--------------------------------------------------------
Terra Eclipse, Inc. is a nationally recognized political technology and
strategy firm located in Aptos, CA and Washington, D.C.

[http://www.terraeclipse.com](http://www.terraeclipse.com)


License: MIT
------------
Copyright (C) 2012 Terra Eclipse, Inc.

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