var assert = require('chai').assert;
var occamsrazor = require('..');

describe('remove', function () {
  var adapter, f1, f2, adapter;
  beforeEach(function () {
    adapter = occamsrazor();
    f1 = function () {};
    f2 = function () {};
    adapter.on('test1', f1);
    adapter.on('test2', f2);
  });

  it('removing everything', function () {
    assert.equal(adapter._functions().length, 2);
    adapter.remove();
    assert.equal(adapter._functions().length, 0);
  });

  it('removing 1 function', function () {
    assert.equal(adapter._functions().length, 2);
    adapter.remove(f1);
    assert.equal(adapter._functions().length, 1);
  });
});
