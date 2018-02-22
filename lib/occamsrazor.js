var ut = require('./utils')
var _batch = require('./batch')

function occamsrazor (options) {
  options = options || {}
  // these should always mutate!
  var _adapters = options._adapters || []
  var _events = options._events || []
  var _ns = options._ns
  var comparator = options.comparator

  /*
  private methods
  */

  function getAdd (opts) {
    opts = opts || {}
    var times = opts.times
    var doesConsume = opts.doesConsume
    return function add () {
      var lastArg = arguments[arguments.length - 1]
      var func = typeof lastArg === 'function' ? lastArg : function () { return lastArg }
      var validators = arguments.length > 1 ? Array.prototype.slice.call(arguments, 0, -1) : []
      var newAdapter = {
        doesConsume: doesConsume, // calling this adapter will remove the event posted
        times: times,
        func: func,
        validators: ut.combineValidators(validators),
        ns: _ns
      }
      _adapters.push(newAdapter)

      // trigger all published event matching this adapter
      ut.filterArray(_events, function (event) {
        if (newAdapter.times === 0) return true
        var filteredAdapters = ut.filterAndSort(event.args, [newAdapter])
        filteredAdapters.forEach(ut.countdown)
        ut.filterArray(_adapters, ut.notExausted)
        ut.triggerAll(event.context, event.args, filteredAdapters)
        // if the adapter consume the event, this gets filtered out
        return !(doesConsume && filteredAdapters.length)
      })
      return or
    }
  }

  /*
  public methods
  */

  /* this function is posting an event: context "this" and arguments */
  function adapt () {
    var context = this
    var args = ut.getArgs(arguments)
    var filteredAdapter = ut.filterAndSortOne(args, _adapters) // the most specific
    if (filteredAdapter) {
      ut.countdown(filteredAdapter)
      ut.filterArray(_adapters, ut.notExausted)
      return filteredAdapter.func.apply(context, args)
    }
  }

  /* this function is posting an event: context "this" and arguments */
  function all () {
    var context = this
    var args = ut.getArgs(arguments)
    var filteredAdapters = ut.filterAndSort(args, _adapters) // all matching adapters
    filteredAdapters.forEach(ut.countdown)
    ut.filterArray(_adapters, ut.notExausted)
    return ut.getAll(context, args, filteredAdapters)
  }

  /* this function is posting an event: context "this" and arguments */
  function trigger () {
    var context = this
    var args = ut.getArgs(arguments)
    var filteredAdapters = ut.filterAndSort(args, _adapters)
    filteredAdapters.forEach(ut.countdown)
    ut.filterArray(_adapters, ut.notExausted)
    ut.triggerAll(context, args, filteredAdapters)
    return or
  }

  /* this function is posting an event: context "this" and arguments */
  function stick () {
    var context = this
    var args = ut.getArgs(arguments)
    var filteredAdapters = ut.filterAndSort(args, _adapters)
    var consumeAdapters = filteredAdapters.filter(function (adapter) { return adapter.doesConsume })
    // adapters published with "consume" trigger the removal of the registered event
    if (!consumeAdapters.length) {
      ut.binaryInsert(_events, { context: this, args: args }, comparator)
    }
    filteredAdapters.forEach(ut.countdown)
    ut.filterArray(_adapters, ut.notExausted)
    ut.triggerAll(context, args, filteredAdapters)
    return or
  }

  function size () {
    var args = ut.getArgs(arguments)
    var funcs = args.length ? ut.filterAndSort(args, _adapters) : _adapters
    return funcs.length
  }

  function remove (func) {
    if (!func && !_ns) {
      _adapters = []
      return or
    }
    ut.filterArray(_adapters, function (adapter) {
      if (func && _ns) {
        return adapter.func !== func || adapter.ns !== _ns
      } else if (func) {
        return adapter.func !== func
      } else if (_ns) {
        return adapter.ns !== _ns
      }
    })
    return or
  }

  function removeIf () {
    var args = ut.getArgs(arguments)
    var funcs = ut.filterAndSort(args, _adapters)
      .map(function (r) {
        return r.func
      })
    funcs.forEach(remove.bind(this))
    return or
  }

  function unstick () {
    var args = ut.getArgs(arguments)
    var validator = ut.combineValidators(args)
    ut.filterArray(_events, function (event) {
      return !validator(event.args)
    })
    return or
  }

  function proxy (id) {
    id = id || Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10)
    return occamsrazor({ _adapters: _adapters, _events: _events, _ns: id, comparator: comparator })
  }

  function batch () {
    return _batch(or, comparator)
  }

  // returns a callable object
  function or () {
    var args = ut.getArgs(arguments)
    return adapt.apply(this, args)
  }

  // post/trigger event
  or.adapt = adapt
  or.all = or.triggerSync = all
  or.trigger = trigger
  or.stick = or.post = stick

  // listen for an event
  or.add = or.on = getAdd()
  or.one = getAdd({ times: 1 })
  or.consume = getAdd({ doesConsume: true })
  or.consumeOne = getAdd({ doesConsume: true, times: 1 })

  // remove listener
  or.remove = or.off = remove
  or.removeIf = removeIf

  // remove event
  or.unstick = or.unpost = unstick

  // various
  or.size = size
  or.proxy = or.namespace = proxy
  or.batch = batch

  or.getAdapters = function () { return _adapters }
  or.getEvents = function () { return _events }

  return or
}

module.exports = occamsrazor
