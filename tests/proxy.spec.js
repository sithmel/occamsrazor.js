var assert = require('chai').assert;
var occamsrazor = require('..');

describe('proxy', function () {
  var adapter, proxy, f1, f2;
  beforeEach(function () {
    adapter = occamsrazor();
    proxy = adapter.proxy();
    f1 = function () {return 1;};
    f2 = function () {return 2;};
    adapter.add('test1', f1);
    proxy.add('test1', f2);
  });

  it('add/remove to proxy', function () {
    assert.equal(adapter._functions().length, 2);
    proxy.remove();
    assert.equal(adapter._functions().length, 1);
  });

  it('add/remove to adapter', function () {
    assert.equal(adapter._functions().length, 2);
    adapter.remove();
    assert.equal(adapter._functions().length, 0);
  });

  it('proxy should return', function () {
    assert.deepEqual(proxy.all('test1'), [2, 1]);
  });

  it('adapter should return', function () {
    assert.deepEqual(adapter.all('test1'), [2, 1]);
  });

  it('proxy should return proxy on chaining', function () {
    var maybeadapter = adapter.add('test1', f1);
    var maybeproxy = proxy.add('test1', f1);

    assert.equal(adapter, maybeadapter);
    assert.equal(proxy, maybeproxy);
  });

});
