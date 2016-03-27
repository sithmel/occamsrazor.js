var assert = require('chai').assert;
var occamsrazor = require('..');

describe('context', function () {
  it('must apply this to an adapter', function () {
    var hello = occamsrazor().add(function () {
      return 'hello '  + this;
    });
    assert.equal(hello.apply('world!'), 'hello world!');
  });

  it('must apply this to a proxy', function () {

    var hello = occamsrazor().proxy().add(function () {
      return 'hello '  + this;
    });

    assert.equal(hello.adapt.apply('world!'), 'hello world!');
  });

  it('must apply this to a method', function () {
    var Factory = function () {
      this.greeting = 'world!';
    };

    Factory.prototype.method = occamsrazor().add(function () {
      return 'hello '  + this.greeting;
    });

    var obj = new Factory;

    assert.equal(obj.method(), 'hello world!');
  });

});
