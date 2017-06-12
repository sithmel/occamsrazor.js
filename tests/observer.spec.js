var assert = require('chai').assert;
var occamsrazor = require('..');
var validator = require('occamsrazor-validator');

describe('observer', function () {
  var is_instrument, is_guitar, is_electricguitar,
    guitar, electricguitar,
    pubsub;

  beforeEach(function () {
    is_instrument = validator().match(function (obj) {
      return 'instrument_name' in obj;
    });

    is_guitar = is_instrument.match(function (obj) {
      return 'nStrings' in obj;
    });

    is_electricguitar = is_guitar.match( function (obj) {
      return 'ampli' in obj;
    });

    guitar = {
      instrument_name : 'guitar',
      nStrings : 6
    };

    electricguitar = {
      instrument_name : 'electric guitar',
      nStrings : 6,
      ampli : 'marshall'
    };

    pubsub = occamsrazor();

    pubsub.on('play', is_guitar, function (evt, instrument) {
      return 'Strumming ' + instrument.instrument_name;
    });

    pubsub.on('play', is_electricguitar, function (evt, instrument) {
      return instrument.instrument_name + ' solo';
    });

    pubsub.on('stop', is_guitar, function (evt, instrument) {
      return 'stop playing';
    });

    pubsub.one('play', is_electricguitar, function (evt, instrument) {
      return 'only once';
    });

    pubsub.on('riff', {instrument_name : 'guitar'}, function (evt, instrument) {
      return 'strumming loud';
    });

    pubsub.on('riff', {instrument_name : 'electric guitar'}, function (evt, instrument) {
      return 'smoking solo';
    });
  });

  it('must remove -one- listener', function () {
    assert.equal(pubsub.size(), 6);
    var outputs = pubsub.all('play', electricguitar);
    assert.equal(pubsub.size(), 5);
    var outputs2 = pubsub.all('play', electricguitar);

    assert(outputs.indexOf('Strumming electric guitar') !== -1);
    assert(outputs.indexOf('electric guitar solo') !== -1);
    assert(outputs.indexOf('only once') !== -1);
    assert.equal(outputs.length, 3);

    assert(outputs2.indexOf('Strumming electric guitar') !== -1);
    assert(outputs2.indexOf('electric guitar solo') !== -1);
    assert.equal(outputs2.length, 2);
  });

  it('must notify an event with 1 handler', function () {
    var outputs = pubsub.all('play', guitar);
    assert(outputs.indexOf('Strumming guitar') !== -1);
    assert.equal(outputs.length, 1);
  });

  it('must notify an event with 1 handler', function () {
    var output1 = pubsub('riff', guitar);
    var output2 = pubsub('riff', electricguitar);
    assert.equal(output1, 'strumming loud');
    assert.equal(output2, 'smoking solo');
  });

});
