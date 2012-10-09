var assert = require('assert');

describe('return emitter', function () {
  var emitter, result;

  beforeEach(function() {
    emitter = require('../')();
    result = [];
  });

  it('should return a new emitter', function (done) {
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

    emitter.series('foo', function () {
      assert.equal(result[0], 'a');
      assert.equal(result[1], 'b');
      assert.equal(result[2], 'c');
      done();
    });
  });
});