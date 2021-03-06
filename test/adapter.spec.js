/* eslint-env node, mocha */
var assert = require('chai').assert
var occamsrazor = require('..')
var validator = require('occamsrazor-validator')

describe('adapter', function () {
  var isInstrument, isGuitar, isElectricGuitar,
    guitar, electricguitar,
    folkGuitarPlayer, rockGuitarPlayer,
    player

  before(function () {
    // validators
    isInstrument = validator().match(function isInstrument (obj) {
      return 'instrument_name' in obj
    })
    isGuitar = isInstrument.match(function isGuitar (obj) {
      return 'nStrings' in obj
    })
    isElectricGuitar = isGuitar.match(function isElectricGuitar (obj) {
      return 'ampli' in obj
    })
    // objects
    guitar = {
      instrument_name: 'guitar',
      nStrings: 6
    }
    electricguitar = {
      instrument_name: 'electric guitar',
      nStrings: 6,
      ampli: 'marshall'
    }
    // adapters
    folkGuitarPlayer = function (guitar) {
      return 'Strumming with ' + guitar.instrument_name
    }
    rockGuitarPlayer = function (guitar) {
      return 'A solo with ' + guitar.instrument_name + ' and ' + guitar.ampli
    }
    player = occamsrazor()
      .add(isGuitar, folkGuitarPlayer)
      .add(isElectricGuitar, rockGuitarPlayer)
  })

  it('can be inspected', function () {
    assert.equal(player.getAdapters().length, 2)
    assert.equal(player.getAdapters()[0].validators.name, 'and(isInstrument isGuitar) (score: 2)')
    assert.equal(player.getAdapters()[1].validators.name, 'and(isInstrument isGuitar isElectricGuitar) (score: 3)')
  })

  it('must be correct size', function () {
    assert.equal(player.size(), 2)
  })

  it('must return number of matching function passing arguments to size', function () {
    assert.equal(player.size(guitar), 1)
  })

  it('must adapt using most specific function', function () {
    assert.equal(player(guitar), 'Strumming with guitar')
    assert.equal(player(electricguitar), 'A solo with electric guitar and marshall')
  })

  it('must adapt using all functions (only 1)', function () {
    var results = player.all(guitar)
    assert.equal(results.length, 1)
    assert.equal(results[0], 'Strumming with guitar')
  })

  it('must adapt using all functions (2)', function () {
    var results = player.all(electricguitar)

    assert.equal(results.length, 2)
    assert.equal(results[1], 'Strumming with electric guitar')
    assert.equal(results[0], 'A solo with electric guitar and marshall')
  })

  it('must ignore extra argument', function () {
    assert.equal(player(guitar, 'extra'), 'Strumming with guitar')
  })
})

describe('general', function () {
  it('must be a function', function () {
    assert.instanceOf(occamsrazor, Function)
  })

  it('must work without any validators', function () {
    var printTest = occamsrazor.adapters()
      .add(function () { return 'test' })
    assert.equal(printTest(), 'test')
  })

  it('must work using an object instead', function () {
    var printTest = occamsrazor.adapters()
      .add('test')
    assert.equal(printTest(), 'test')
  })

  it('must convert undefined to isAnything', function () {
    var works = occamsrazor().add(undefined, function (x) {
      return x
    })
    assert.equal(works('anything'), 'anything')
  })

  it('must throw on multiple matches', function () {
    var func1 = function (a) { return 'func1' }
    var func2 = function (a) { return 'func2' }

    var test = occamsrazor()
      .add(func1)
      .add(func2)

    assert.throws(test, 'Occamsrazor (get): More than one adapter fits')
  })

  describe('adapter hierarchy', function () {
    var isAnything, isNumber,
      notValid, notFound, square,
      getSquare

    beforeEach(function () {
      isAnything = validator()
      isNumber = validator().match(function (obj) {
        return typeof obj === 'number'
      })

      notValid = function (a) { return 'not valid' }
      notFound = function (a) { return 'not found' }
      square = function (a) { return a * a }

      getSquare = occamsrazor()
        .add(notFound)
    })

    it('must return the only adapter available', function () {
      assert.equal(getSquare(2), 'not found')
    })

    it('must return a valid adapter', function () {
      getSquare
        .add(isAnything, notValid)

      assert.equal(getSquare('a'), 'not valid')
      assert.equal(getSquare(), 'not found')
    })

    it('must return the more specific adapter', function () {
      getSquare
        .add(isAnything, notValid)

      getSquare
        .add(isNumber, square)

      assert.equal(getSquare(2), 4)
      assert.equal(getSquare('a'), 'not valid')
      assert.equal(getSquare(), 'not found')
    })
  })

  describe('multiadapter', function () {
    var isNumber, sum, hello
    before(function () {
      isNumber = validator().match(function isNumber (obj) {
        return typeof obj === 'number' && !isNaN(obj)
      })

      sum = occamsrazor()
        .add(isNumber, isNumber, isNumber, function (a, b, c) {
          return a + b + c
        })

      hello = occamsrazor()
        .add('hello', ' ', 'world!', function (a, b, c) {
          return a + b + c
        })
    })

    it('can be inspected', function () {
      assert.equal(sum.getAdapters().length, 1)
      assert.equal(sum.getAdapters()[0].validators.name, 'isNumber (score: 1), isNumber (score: 1), isNumber (score: 1)')
    })

    it('must execute a function with 3 arguments', function () {
      assert.equal(sum(1, 2, 3), 6)
    })

    it('must execute a function with 3 arguments (3)', function () {
      assert.equal(hello('hello', ' ', 'world!'), 'hello world!')
    })
  })
})

describe('sort stability', function () {
  var registry
  before(function () {
    var isNumber = validator().match(function isNumber (obj) {
      return typeof obj === 'number' && !isNaN(obj)
    })

    registry = occamsrazor()
      .add(isNumber, (a) => a * 1)
      .add(isNumber, (a) => a * 2)
      .add(isNumber, (a) => a * 3)
      .add(isNumber, (a) => a * 4)
      .add(isNumber, (a) => a * 5)
      .add(isNumber, (a) => a * 6)
      .add(isNumber, (a) => a * 7)
      .add(isNumber, (a) => a * 8)
      .add(isNumber, (a) => a * 9)
      .add(isNumber, (a) => a * 10)
      .add(isNumber, (a) => a * 11)
  })

  it('can be inspected', function () {
    var all = registry.all(1)
    assert.equal(all.length, 11)
    assert.deepEqual(all, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  })
})
