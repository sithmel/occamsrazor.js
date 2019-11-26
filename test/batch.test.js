/* eslint-env node, mocha */
var assert = require('chai').assert
var occamsrazor = require('..')
var isNumber = require('occamsrazor-match/extra/isNumber')

describe('batch', function () {
  it('returns a batch', function () {
    var adapter = occamsrazor()
    var batch = adapter.batch()
    assert.typeOf(batch.queue, 'function')
  })

  it('queues arguments', function () {
    var adapter = occamsrazor()
    var batch = adapter.batch()
    batch.queue.call({}, 'test')
    batch.queue.call({}, 1, 2, 3)
    assert.deepEqual(batch.getQueue(), [
      { context: {}, args: ['test'] },
      { context: {}, args: [1, 2, 3] }
    ])
  })

  it('queues arguments in right order', function () {
    var adapter = occamsrazor({ comparator: function (a, b) { return a.args[0] - b.args[0] } })
    var batch = adapter.batch()
    batch.queue.call({}, 2)
    batch.queue.call({}, 3)
    batch.queue.call({}, 1)
    assert.deepEqual(batch.getQueue(), [
      { context: {}, args: [1] },
      { context: {}, args: [2] },
      { context: {}, args: [3] }
    ])
  })

  it('return adapters', function () {
    var adapter = occamsrazor()
    adapter.add(isNumber, function (n) {
      return n * n
    })
    var batch = adapter.batch()
    batch.queue.call({}, 2)
    batch.queue.call({}, 3)
    assert.deepEqual(batch.adapt(), [4, 9])
  })

  it('return adapters (missing one)', function () {
    var adapter = occamsrazor()
    adapter.add(isNumber, function (n) {
      return n * n
    })
    var batch = adapter.batch()
    batch.queue.call({}, 2)
    batch.queue.call({}, '3')
    assert.deepEqual(batch.adapt(), [4, undefined])
  })

  it('return adapters (empty array)', function () {
    var adapter = occamsrazor()
    adapter.add(isNumber, function (n) {
      return n * n
    })
    var batch = adapter.batch()
    assert.deepEqual(batch.adapt(), [])
    assert.deepEqual(batch.all(), [])
  })

  it('return all adapters', function () {
    var adapter = occamsrazor()
    adapter.add(isNumber, function (n) {
      return n * n
    })
    adapter.add(isNumber, function (n) {
      return n + 10
    })
    var batch = adapter.batch()
    batch.queue(2)
    batch.queue(3)
    assert.deepEqual(batch.all(), [4, 12, 9, 13])
  })

  it('triggers all handlers', function (done) {
    var adapter = occamsrazor()
    adapter.on(isNumber, function (n) {
      return n * n
    })
    adapter.on(isNumber, function (n) {
      return n + 10
    })
    var batch = adapter.batch()
    batch.queue(2)
    batch.queue(3)
    batch.trigger(function (err, res) {
      assert.equal(err, null)
      assert.deepEqual(res, [4, 12, 9, 13])
      done()
    })
  })
})
