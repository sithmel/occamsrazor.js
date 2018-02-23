var ut = require('./utils')

function batch (or, comparator, _queue) {
  _queue = []

  function queue () {
    var args = ut.getArgs(arguments)
    ut.binaryInsert(_queue, { context: this, args: args }, comparator)
    return batch(or, comparator, _queue)
  }

  function all () {
    var q = _queue
    _queue = []
    return q.map(function (item) {
      return or.all.apply(item.context, item.args)
    }).reduce(function (a, b) {
      return a.concat(b)
    }, []) // flatten
  }

  function trigger (callback) {
    callback = callback || function () {}
    ut.triggerOne(null, [], function () {
      var res
      try {
        res = all()
        callback(null, res)
      } catch (err) {
        callback(err)
      }
    })
    return or
  }

  function adapt () {
    var q = _queue
    _queue = []
    return q.map(function (item) {
      return or.adapt.apply(item.context, item.args)
    })
  }

  function getQueue () {
    return _queue
  }

  return {
    queue: queue,
    adapt: adapt,
    trigger: trigger,
    all: all,
    triggerSync: all,
    getQueue: getQueue
  }
}

module.exports = batch
