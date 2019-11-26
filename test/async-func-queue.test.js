/* eslint-env node, mocha */
var assert = require('chai').assert
var occamsrazor = require('..')
var fakeOccamsrazor = require('../async-func-queue/fake-occamsrazor')
var flushQueue = require('../async-func-queue/flush-queue')

describe('async-func-queue', function () {
  it('queue methods call', function (done) {
    fakeOccamsrazor('_private', 'events')
    global.events.on('test', function (e) {
      assert.equal(e, 'test')
      done()
    })
    global.events.trigger('test')
    global.events = occamsrazor()
    flushQueue('_private', 'events')
  })

  it('check replacement fix', function (done) {
    fakeOccamsrazor('_private', 'events')
    var events = global.events // oh no, saved a reference from the global object

    global.events = occamsrazor() // global is now loaded

    flushQueue('_private', 'events')

    events.on('test', function (e) { // using out of date reference
      assert.equal(e, 'test')
      done()
    })
    events.trigger('test')
  })
})
