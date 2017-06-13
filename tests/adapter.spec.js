var assert = require('chai').assert;
var occamsrazor = require('..');
var validator = require('occamsrazor-validator');

describe('adapter', function () {
  var is_instrument, is_guitar, is_electricguitar,
    instrument, drum, guitar, electricguitar,
    folkGuitarPlayer, rockGuitarPlayer,
    player;

  before(function () {
    // validators
    is_instrument = validator().match(function is_instrument(obj) {
      return 'instrument_name' in obj;
    });
    is_guitar = is_instrument.match( function is_guitar(obj) {
      return 'nStrings' in obj;
    });
    is_electricguitar = is_guitar.match(function is_electricguitar(obj) {
      return 'ampli' in obj;
    });
    // objects
    instrument = {instrument_name : 'instrument'};
    drum   = {
      instrument_name : 'instrument',
      crash : 'tin tin'
    };
    guitar = {
      instrument_name : 'guitar',
      nStrings : 6
    };
    electricguitar = {
      instrument_name : 'electric guitar',
      nStrings : 6,
      ampli : 'marshall'
    };
    // adapters
    folkGuitarPlayer = function (guitar) {
      return 'Strumming with ' + guitar.instrument_name;
    };
    rockGuitarPlayer = function (guitar) {
      return 'A solo with ' + guitar.instrument_name + ' and ' + guitar.ampli;
    };
    player = occamsrazor()
    .add(is_guitar, folkGuitarPlayer)
    .add(is_electricguitar, rockGuitarPlayer);
  });

  it('can be inspected', function () {
    assert.equal(player.functions().length, 2);
    assert.equal(player.functions()[0].validators.name, 'and(is_instrument is_guitar) (score: 2)');
    assert.equal(player.functions()[1].validators.name, 'and(is_instrument is_guitar is_electricguitar) (score: 3)');
  });

  it('must be correct size', function () {
    assert.equal(player.size(), 2);
  });

  it('must adapt using most specific function', function () {
    assert.equal(player(guitar) , 'Strumming with guitar');
    assert.equal(player(electricguitar) , 'A solo with electric guitar and marshall');
  });

  it('must adapt using all functions (only 1)', function () {
    var results = player.all(guitar);
    assert.equal(results.length, 1);
    assert.equal(results[0] , 'Strumming with guitar');
  });

  it('must adapt using all functions (2)', function () {
    var results = player.all(electricguitar);

    assert.equal(results.length, 2);
    assert.equal(results[1]  , 'Strumming with electric guitar');
    assert.equal(results[0] , 'A solo with electric guitar and marshall');
  });

  it('must ignore extra argument', function () {
    assert.equal(player(guitar, 'extra') , 'Strumming with guitar');
  });

  describe('merge adapters', function () {
    var pianoPlayer, mergedPlayer;

    before(function () {
      pianoPlayer = occamsrazor()
        .add({keys: undefined}, function () { return 'playing the piano!';});
      mergedPlayer = pianoPlayer.merge(player);
    });

    it('must be correct size', function () {
      assert.equal(player.size(), 2);
      assert.equal(pianoPlayer.size(), 1);
      assert.equal(mergedPlayer.size(), 3);
    });

    it('must not merge in-place', function () {
      assert.notEqual(pianoPlayer, mergedPlayer);
      assert.notEqual(player, mergedPlayer);
    });

    it('must adapt', function () {
      assert.equal(mergedPlayer(guitar) , 'Strumming with guitar');
      assert.equal(mergedPlayer({keys: 288}) , 'playing the piano!');
    });

  });
});

describe('general', function () {

  it('must be a function', function () {
    assert.instanceOf(occamsrazor, Function);
  });

  it('must work without any validators', function () {
    var print_test = occamsrazor.adapters()
    .add(function () {return 'test';});
    assert.equal(print_test() , 'test');
  });

  it('must work using a object instead', function () {
    var print_test = occamsrazor.adapters()
    .add('test');
    assert.equal(print_test() , 'test');
  });

  it('must convert undefined to isAnything', function () {
    var works = occamsrazor().add(undefined, function (x) {
      return x;
    });
    assert.equal(works('anything'), 'anything');
  });

  it('must throw on multiple matches', function () {
    var func1 = function (a) { return 'func1';};
    var func2 = function (a) { return 'func2';};

    var test = occamsrazor()
    .add(func1)
    .add(func2);

    assert.throws(test, 'Occamsrazor (get): More than one adapter fits');
  });

  it('must throw if no matches', function () {
    var test = occamsrazor();
    assert.throws(test, 'Occamsrazor (get): Function not found');
  });

  describe('adapter hierarchy', function () {
    var isAnything, isNumber,
      notValid, notFound, square,
      getSquare;

    beforeEach(function () {
      isAnything = validator();
      isNumber = validator().match(function (obj) {
        return typeof obj === 'number';
      });

      notValid = function (a) {return 'not valid';};
      notFound = function (a) {return 'not found';};
      square = function (a) {return a*a;};

      getSquare = occamsrazor()
      .add(notFound);
    });

    it('must return the only adapter available', function () {
      assert.equal(getSquare(2), 'not found');
    });

    it('must return a valid adapter', function () {
      getSquare
      .add(isAnything, notValid);

      assert.equal(getSquare('a'), 'not valid');
      assert.equal(getSquare(), 'not found');
    });

    it('must return the more specific adapter', function () {
      getSquare
      .add(isAnything, notValid);

      getSquare
      .add(isNumber, square);

      assert.equal(getSquare(2), 4);
      assert.equal(getSquare('a'), 'not valid');
      assert.equal(getSquare(), 'not found');
    });
  });

  describe('multiadapter', function () {
    var is_number, sum, hello;
    before(function () {
      is_number = validator().match(function isNumber(obj) {
        return typeof obj === 'number' && ! isNaN(obj);
      });

      sum = occamsrazor()
      .add(is_number, is_number, is_number, function (a, b, c) {
        return a + b + c;
      });

      hello = occamsrazor()
      .add('hello', ' ', 'world!', function (a,b,c) {
        return a + b + c;
      });
    });

    it('can be inspected', function () {
      assert.equal(sum.functions().length, 1);
      assert.equal(sum.functions()[0].validators.name, 'isNumber (score: 1), isNumber (score: 1), isNumber (score: 1)');
    });

    it('must execute a function with 3 arguments', function () {
      assert.equal(sum(1, 2, 3) , 6);
    });

    it('must execute a function with 3 arguments (3)', function () {
      assert.equal(hello('hello', ' ', 'world!') , 'hello world!');
    });
  });
});
