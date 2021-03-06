/* eslint-env node, mocha */
var assert = require('chai').assert
var isNumber = require('occamsrazor-match/extra/isNumber')
var occamsrazor = require('..')

describe('stick', function () {
  var adapter
  beforeEach(function () {
    adapter = occamsrazor()
  })

  it('must trigger without stick', function (done) {
    var executed = ''
    adapter.on('match', function () {
      executed += 'A'
    })
    adapter.on('notmatch', function () {
      executed += 'B'
    })

    adapter.trigger('match')

    setTimeout(function () {
      adapter.on('match', function () {
        executed += 'C'
      })
      adapter.on('notmatch', function () {
        executed += 'D'
      })
      assert.equal(executed, 'A')
      done()
    }, 4)
  })

  it('must trigger with stick', function (done) {
    var executed = ''
    adapter.on('match', function () {
      executed += 'A'
    })
    adapter.on('notmatch', function () {
      executed += 'B'
    })
    adapter.stick('match')
    setTimeout(function () {
      adapter.on('match', function () {
        executed += 'C'
      })
      adapter.on('notmatch', function () {
        executed += 'D'
      })
      setTimeout(function () {
        assert.equal(executed, 'AC')
        done()
      }, 4)
    }, 4)
  })

  it('must unstick event', function (done) {
    var executed = ''
    adapter.on('match', function () {
      executed += 'A'
    })
    adapter.on('notmatch', function () {
      executed += 'B'
    })

    adapter.stick('match')
    adapter.stick('xxx')
    assert.equal(adapter.getEvents().length, 2)
    adapter.unstick('match')
    assert.equal(adapter.getEvents().length, 1)

    setTimeout(function () {
      adapter.on('match', function () {
        executed += 'C'
      })
      adapter.on('notmatch', function () {
        executed += 'D'
      })
      setTimeout(function () {
        assert.equal(executed, 'A')
        done()
      }, 4)
    }, 4)
  })

  it('must consume', function (done) {
    var executed = ''
    adapter.stick('match')
    adapter.consume('match', function () {
      executed += 'A'
    })
    adapter.stick('match')
    adapter.on('match', function () {
      executed += 'A' // this is ignored
    })

    setTimeout(function () {
      adapter.consume('match', function () {
        executed += 'C'
      })
      setTimeout(function () {
        assert.equal(executed, 'AA')
        done()
      }, 4)
    }, 4)
  })

  it('must consume only one', function (done) {
    var executed = ''
    adapter.stick(3)
    adapter.stick(2)
    adapter.stick(1)
    adapter.consumeOne(isNumber, function (number) {
      assert.equal(number, 3)
      executed += 'A'
    })
    adapter.consumeOne(isNumber, function (number) {
      assert.equal(number, 2)
      executed += 'B'
    })
    adapter.consumeOne(isNumber, function (number) {
      assert.equal(number, 1)
      executed += 'C'
      assert.equal(executed, 'ABC')
      done()
    })
  })

  it('must consume only one (2)', function (done) {
    var executed = ''
    adapter.stick(3)
    adapter.stick(2)
    adapter.consumeOne(isNumber, function (number) {
      assert.equal(number, 3)
      executed += 'A'
    })
    adapter.consumeOne(isNumber, function (number) {
      assert.equal(number, 2)
      executed += 'B'
    })
    adapter.consumeOne(isNumber, function (number) {
      assert.equal(number, 1)
      executed += 'C'
      assert.equal(executed, 'ABC')
      done()
    })
    adapter.stick(1)
  })

  it('must consume only one (sorted)', function (done) {
    var adapter2 = occamsrazor({ comparator: function (a, b) { return a.args[0] - b.args[0] } })
    var executed = ''
    adapter2.stick(3)
    adapter2.stick(2)
    adapter2.stick(1)
    adapter2.consumeOne(isNumber, function (number) {
      assert.equal(number, 1)
      executed += 'A'
    })
    adapter2.consumeOne(isNumber, function (number) {
      assert.equal(number, 2)
      executed += 'B'
    })
    adapter2.consumeOne(isNumber, function (number) {
      assert.equal(number, 3)
      executed += 'C'
      assert.equal(executed, 'ABC')
      done()
    })
  })
})
