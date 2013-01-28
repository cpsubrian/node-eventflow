var eventflow = require('../')
  , assert = require('assert')
  , emitter;

beforeEach(function() {
  emitter = eventflow();
});

describe('series', function() {
  var result;

  beforeEach(function() {
    result = [];
  });

  it('should run handlers in series', function (done) {
    emitter.on('foo', function () {
      result.push('a');
    });

    emitter.on('foo', function (cb) {
      result.push('b');
      cb();
    });

    emitter.on('foo', function () {
      result.push('c');
    });

    emitter.once('foo', function () {
      result.push('d');
    });

    emitter.once('foo', function (cb) {
      result.push('e');
      cb();
    });

    assert.equal(emitter.listeners('foo').length, 5);

    emitter.series('foo', function () {
      assert.equal(emitter.listeners('foo').length, 3);
      assert.equal(result[0], 'a');
      assert.equal(result[1], 'b');
      assert.equal(result[2], 'c');
      assert.equal(result[3], 'd');
      assert.equal(result[4], 'e');
      result = [];
      emitter.series('foo', function () {
        assert.equal(emitter.listeners('foo').length, 3);
        assert.equal(result[0], 'a');
        assert.equal(result[1], 'b');
        assert.equal(result[2], 'c');
        assert.equal(result.length, 3);
        done();
      });
    });
  });

  it('should run handlers in a series with arguments', function (done) {
    emitter.on('bar', function (a, b) {
      result.push(a);
      result.push(b);
    });

    emitter.on('bar', function (a, b, cb) {
      result.push(a);
      result.push(b);
      cb();
    });

    emitter.once('bar', function (a, b) {
      result.push(a);
      result.push(b);
    });

    emitter.once('bar', function (a, b, cb) {
      result.push(a);
      result.push(b);
      cb();
    });

    assert.equal(emitter.listeners('bar').length, 4);

    emitter.series('bar', 'foo', 'baz', function () {
      assert.equal(emitter.listeners('bar').length, 2);
      assert.equal(result[0], 'foo');
      assert.equal(result[1], 'baz');
      assert.equal(result[2], 'foo');
      assert.equal(result[3], 'baz');
      assert.equal(result[4], 'foo');
      assert.equal(result[5], 'baz');
      assert.equal(result[6], 'foo');
      assert.equal(result[7], 'baz');
      result = [];
      emitter.series('bar', 'foo', 'baz', function () {
        assert.equal(emitter.listeners('bar').length, 2);
        assert.equal(result[0], 'foo');
        assert.equal(result[1], 'baz');
        assert.equal(result[2], 'foo');
        assert.equal(result[3], 'baz');
        assert.equal(result.length, 4);
        done();
      });
    });
  });

  it('should support optional use of `results`', function (done) {
    emitter.on('fruit', function (cb) {
      cb(null, 'apple');
    });
    emitter.on('fruit', function () {
      return 'orange';
    });
    emitter.once('fruit', function (cb) {
      cb(null, 'grape');
    });
    emitter.once('fruit', function () {
      return 'lime';
    });
    emitter.series('fruit', function (err, results) {
      assert.ifError(err);
      assert.equal(results[0], 'apple');
      assert.equal(results[1], 'orange');
      assert.equal(results[2], 'grape');
      assert.equal(results[3], 'lime');
      done();
    });
  });

  it('should support optional use of `error`', function (done) {
    emitter.on('drink', function () {
      result.push('coke');
    });
    emitter.once('drink', function (cb) {
      cb('oh no! first');
    });
    emitter.on('drink', function (cb) {
      cb('oh no!');
    });
    emitter.on('drink', function () {
      result.push('pepsi');
    });
    emitter.series('drink', function (err) {
      assert.equal(result[0], 'coke');
      assert.equal(result.length, 1);
      assert.equal(err, 'oh no! first');
      result = [];
      emitter.series('drink', function (err) {
        assert.equal(result[0], 'coke');
        assert.equal(result.length, 1);
        assert.equal(err, 'oh no!');
        done();
      });
    });
  });

  it('should support sync listeners returning errors', function (done) {
    emitter.once('eat', function () {
      return new Error('I am not really hungry...');
    });
    emitter.on('eat', function () {
      return new Error('I am full');
    });
    emitter.series('eat', function (err, results) {
      assert.equal(err.message, 'I am not really hungry...');
      emitter.series('eat', function (err, results) {
        assert.equal(err.message, 'I am full');
        done();
      });
    });
  });
});


describe('parallel', function () {
  var result;

  beforeEach(function () {
    result = {};
  });

  it('should run handlers in parallel', function (done) {
    emitter.on('candy', function () {
      result.sour = 'Sour Patch';
    });
    emitter.on('candy', function (cb) {
      result.hard = 'Jolly Rancher';
      cb();
    });
    emitter.on('candy', function () {
      result.boring = 'Hershey Bar';
    });
    emitter.on('candy', function (cb) {
      result.perfect = 'Peanut Butter Cup';
      cb();
    });
    emitter.parallel('candy', function () {
      assert.equal(result.sour, 'Sour Patch');
      assert.equal(result.hard, 'Jolly Rancher');
      assert.equal(result.boring, 'Hershey Bar');
      assert.equal(result.perfect, 'Peanut Butter Cup');
      done();
    });
  });

  it ('should be able to be run multiple times', function (done) {
    emitter.on('numbers', function () {
      return 1;
    });
    emitter.on('numbers', function() {
      return 2;
    });
    emitter.once('numbers', function() {
      return 3;
    });
    emitter.once('numbers', function() {
      return 4;
    });
    emitter.parallel('numbers', function (err, results) {
      assert.ifError(err);
      assert.equal(results[1], 2);
      assert.equal(results[3], 4);
      assert.equal(results.length, 4);
      emitter.parallel('numbers', function (err, results) {
        assert.ifError(err);
        assert.equal(results[0], 1);
        assert.equal(results.length, 2);
        done();
      });
    });
  });
});

describe('invoke', function () {
  it('should cause an error if there are no listeners', function (done) {
    emitter.invoke('timestamp', function (err, timestamp) {
      assert(err);
      done();
    });
  });

  it('should cause an error if there is more than one listener', function (done) {
    emitter.on('timestamp', function () {
      return new Date().getTime();
    });
    emitter.on('timestamp', function () {
      return new Date().getTime();
    });
    emitter.invoke('timestamp', function (err, timestamp) {
      assert(err);
      done();
    });
  });

  it('should work when there is exactly one synchronous listener', function (done) {
    var timestamp = new Date().getTime();
    emitter.on('timestamp', function () {
      return timestamp;
    });
    emitter.invoke('timestamp', function (err, value) {
      assert.ifError(err);
      assert.equal(value, timestamp);
      done();
    });
  });

  it('should respect exactly one synchronous .once listener', function (done) {
    var timestamp = new Date().getTime();
    emitter.once('timestamp', function () {
      return timestamp;
    });
    emitter.invoke('timestamp', function (err, value) {
      assert.ifError(err);
      assert.equal(value, timestamp);
      emitter.invoke('timestamp', function (err, value) {
        assert(err);
        done();
      });
    });
  });

  it('should respect exactly one asynchronous listener', function (done) {
    var timestamp = new Date().getTime();
    emitter.on('timestamp', function (callback) {
      callback(null, timestamp);
    });
    emitter.invoke('timestamp', function (err, value) {
      assert.ifError(err);
      assert.equal(value, timestamp);
      done();
    });
  });

  it('should respect exactly one asynchronous .once listener', function (done) {
    var timestamp = new Date().getTime();
    emitter.once('timestamp', function (callback) {
      callback(null, timestamp);
    });
    emitter.invoke('timestamp', function (err, value) {
      assert.ifError(err);
      assert.equal(value, timestamp);
      emitter.invoke('timestamp', function (err, value) {
        assert(err);
        done();
      });
    });
  });

  it('should work with arguments', function (done) {
    emitter.on('add', function (a, b) {
      return a + b;
    });
    emitter.invoke('add', 1, 2, function (err, value) {
      assert.ifError(err);
      assert.equal(value, 3);
      done();
    });
  });

  it('should work with arguments, asynchronously', function (done) {
    emitter.on('subtract', function (a, b, callback) {
      callback(null, a - b);
    });
    emitter.invoke('subtract', 3, 2, function (err, value) {
      assert.ifError(err);
      assert.equal(value, 1);
      done();
    });
  });

  it('should work with arguments using .once listener', function (done) {
    emitter.once('multiply', function (a, b) {
      return a * b;
    });
    emitter.invoke('multiply', 2, 3, function (err, value) {
      assert.ifError(err);
      assert.equal(value, 6);
      done();
    });
  });

  it('should work with arguments, asynchronously, using .once listener', function (done) {
    emitter.once('modulus', function (a, b, callback) {
      // You thought I was going to divide, didn't you?
      callback(null, a % b);
    });
    emitter.invoke('modulus', 3, 2, function (err, value) {
      assert.ifError(err);
      assert.equal(value, 1);
      done();
    });
  });

  it('should be able to be called multiple times', function (done) {
    emitter.on('echo', function (msg) {
      return msg;
    });
    emitter.invoke('echo', 'hello', function (err, value) {
      assert.ifError(err);
      assert.equal(value, 'hello');
      emitter.invoke('echo', 'world', function (err, value) {
        assert.ifError(err);
        assert.equal(value, 'world');
        done();
      });
    });
  });

  it('should support synchronous invoke', function () {
    emitter.on('sync', function () {
      return 'isSync';
    });
    assert.equal(emitter.invoke('sync'), 'isSync');
    emitter.once('resync', function () {
      return 'isSync';
    });
    assert.equal(emitter.invoke('resync'), 'isSync');
  });
});

describe('waterfall', function() {
  it('should pass a value between handlers', function (done) {
    emitter.on('foo', function (n) {
      return n + 1;
    });

    emitter.on('foo', function (n, cb) {
      cb(null, n * 5);
    });

    emitter.on('foo', function (n) {
      return n - 3;
    });

    emitter.waterfall('foo', 0, function (err, n) {
      assert.equal(n, 2);
      done();
    });
  });

  it('should work with one or more .once handlers', function (done) {
    emitter.once('foo', function (n) {
      return n + 1;
    });

    emitter.once('foo', function (n, cb) {
      cb(null, n * 5);
    });

    emitter.on('foo', function (n) {
      return n - 3;
    });

    emitter.waterfall('foo', 0, function (err, n) {
      assert.equal(n, 2);
      done();
    });
  });

  it('should support optional use of `error`', function (done) {
    emitter.on('drink', function (n) {
      return n + 1;
    });
    emitter.on('drink', function (n, cb) {
      cb('oh no!');
    });
    emitter.on('drink', function (n) {
      return n - 3;
    });
    emitter.waterfall('drink', 0, function (err, n) {
      assert.equal(n, undefined);
      assert.equal(err, 'oh no!');
      done();
    });
  });
});
