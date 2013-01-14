var eventflow = require('../')
  , EventEmitter = require('events').EventEmitter
  , inherits = require('util').inherits
  , assert = require('assert');

function assertEmitter (emitter, done) {
  var result = [];

  emitter.on('foo', function () {
    result.push('a');
  });

  emitter.on('foo', function (cb) {
    result.push('b');
    cb();
  });

  emitter.series('foo', function () {
    assert.equal(result[0], 'a');
    assert.equal(result[1], 'b');
    done();
  });
}

describe('create eventflow objects', function () {

  it('can return new emitter', function (done) {
    assertEmitter(eventflow(), done);
  });

  it('can extend existing emitter', function (done) {
    assertEmitter(eventflow(new EventEmitter()), done);
  });

  it('can extend existing emitter class', function (done) {
    function MyEmitter () {
      EventEmitter.call(this);
    }
    inherits(MyEmitter, EventEmitter);
    eventflow(MyEmitter);
    assertEmitter(new MyEmitter(), done);
  });

  it('can convert a regular object into an eventflow emitter', function (done) {
    var myThing = {
      type: 'car',
      name: 'Civic'
    };
    assertEmitter(eventflow(myThing), done);
  });

});