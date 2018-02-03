/* eslint-env node, mocha */
var assert = require('chai').assert
var occamsrazor = require('..')

describe('registry', function () {
  it('testing empty registry', function () {
    var test = occamsrazor.registry('main')('test')
    assert.instanceOf(test, Function)
  })

  it('testing full registry', function () {
    occamsrazor.registry('main')('test').add(function () { return 'ok' })
    var test2 = occamsrazor.registry('main')('test')
    assert.equal(test2(), 'ok')
  })

  it('testing default registry', function () {
    occamsrazor.registry()('test').add(function () { return 'ok' })
    var test2 = occamsrazor.registry()('test')
    assert.equal(test2(), 'ok')
  })
})
