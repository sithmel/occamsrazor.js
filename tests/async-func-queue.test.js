/* eslint-env node, mocha */
var assert = require('chai').assert
var occamsrazor = require('..')
var fakeOccamsrazor = require('../async-func-queue/fake-occamsrazor')
var flushQueue = require('../async-func-queue/flush-queue')

describe('async-func-queue', function () {
  it('queue methods call', function (done) {
    var events = fakeOccamsrazor('_private')
    events.on('test', function (e) {
      assert.equal(e, 'test')
      done()
    })
    events.trigger('test')
    events = occamsrazor()
    flushQueue('_private', events)
  })
})
