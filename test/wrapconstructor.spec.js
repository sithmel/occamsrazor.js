/* eslint-env node, mocha */
var assert = require('chai').assert
var occamsrazor = require('..')

describe('wrapConstructor', function () {
  it('must wrap a constructor function', function () {
    var Constructor = occamsrazor.wrapConstructor(function (x) {
      this.x = x
    })

    assert.equal(Constructor('anything').x, 'anything')
    assert.equal(new Constructor('anything').x, 'anything')
  })

  it('must preserve prototype and constructor', function () {
    var Constructor = function (x) {
      this.x = x
    }
    Constructor.prototype.number = 10

    var WrappedConstructor = occamsrazor.wrapConstructor(Constructor)

    var obj = WrappedConstructor('5')
    assert.equal(obj.x, 5)
    assert.equal(obj.number, 10)
    assert.equal(obj.constructor, Constructor)

    var obj1 = new WrappedConstructor('5')
    assert.equal(obj1.x, 5)
    assert.equal(obj1.number, 10)
    assert.equal(obj1.constructor, Constructor)
  })

  it('must adapt a constructor function', function () {
    var Constructor = occamsrazor().add(occamsrazor.wrapConstructor(function (x) {
      this.x = x
    }))

    assert.equal(Constructor('anything').x, 'anything')
    assert.equal(new Constructor('anything').x, 'anything')
  })

  it('must adapt a constructor function, preserving prototype and constructor', function () {
    var Constructor = function (x) {
      this.x = x
    }
    Constructor.prototype.number = 10

    var WrappedConstructor = occamsrazor().add(occamsrazor.wrapConstructor(Constructor))

    var obj = WrappedConstructor('5')
    assert.equal(obj.x, 5)
    assert.equal(obj.number, 10)
    assert.equal(obj.constructor, Constructor)
  })
})
