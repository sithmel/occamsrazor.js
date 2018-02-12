/* eslint-env node, mocha */
var assert = require('chai').assert
var ut = require('../lib/utils')

describe('binaryInsert', function () {
  var array, comparator
  beforeEach(function () {
    comparator = function (a, b) { return a - b }
    array = [10, 12, 12, 13, 15]
  })

  it('is a function', function () {
    assert.typeOf(ut.binaryInsert, 'function')
  })

  it('insert at the beginning', function () {
    ut.binaryInsert(array, 1, comparator)
    assert.deepEqual(array, [1, 10, 12, 12, 13, 15])
  })

  it('insert at the beginning (2)', function () {
    ut.binaryInsert(array, 10, comparator)
    assert.deepEqual(array, [10, 10, 12, 12, 13, 15])
  })

  it('insert in the middle', function () {
    ut.binaryInsert(array, 14, comparator)
    assert.deepEqual(array, [10, 12, 12, 13, 14, 15])
  })

  it('insert in the middle(2)', function () {
    ut.binaryInsert(array, 13, comparator)
    assert.deepEqual(array, [10, 12, 12, 13, 13, 15])
  })

  it('insert in the middle (3)', function () {
    ut.binaryInsert(array, 12, comparator)
    assert.deepEqual(array, [10, 12, 12, 12, 13, 15])
  })

  it('insert at the end', function () {
    ut.binaryInsert(array, 16, comparator)
    assert.deepEqual(array, [10, 12, 12, 13, 15, 16])
  })

  it('insert at the end', function () {
    ut.binaryInsert(array, 15, comparator)
    assert.deepEqual(array, [10, 12, 12, 13, 15, 15])
  })

  it('insert empty', function () {
    var a = []
    ut.binaryInsert(a, 15, comparator)
    assert.deepEqual(a, [15])
  })

  it('insert without comparator', function () {
    ut.binaryInsert(array, 1, undefined)
    assert.deepEqual(array, [10, 12, 12, 13, 15, 1])
  })
})
