var ut = require('./utils')

function batch (or, comparator) {
  var _queue = []

  function queue () {
    var args = ut.getArgs(arguments)
    ut.binaryInsert(_queue, { context: this, args: args }, comparator)
  }

  function trigger () {
    queue.forEach(function (item) {
      or.trigger.apply(item.context, item.args)
    })
    return or
  }

  function all () {
    return _queue.map(function (item) {
      return or.all.apply(item.context, item.args)
    }).reduce(function (a, b) {
      return a.concat(b)
    }, []) // flatten
  }

  function adapt () {
    return _queue.map(function (item) {
      return or.adapt.apply(item.context, item.args)
    })
  }

  function stick () {
    _queue.forEach(function (item) {
      or.stick.apply(item.context, item.args)
    })
    return or
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
    stick: stick,
    post: stick,
    getQueue: getQueue
  }
}

module.exports = batch
