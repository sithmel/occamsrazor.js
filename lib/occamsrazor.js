var ut = require('./utils')

function occamsrazor (_adapters, _events) {
  _adapters = _adapters || []
  _events = _events || []

  /*
  private methods
  */

  function _removeExaustedAdapters () {
    _adapters = _adapters.filter(function (adapter) {
      return adapter.times !== 0
    })
  }

  function getAdd (times, doesConsume) {
    return function add () {
      var ns = this.ns
      var filteredAdapters
      var lastArg = arguments[arguments.length - 1]
      var func = typeof lastArg === 'function' ? lastArg : function () { return lastArg }
      var validators = arguments.length > 1 ? Array.prototype.slice.call(arguments, 0, -1) : []
      var newAdapter = {
        doesConsume: doesConsume, // calling this adapter will remove the event posted
        times: times,
        func: func,
        validators: ut.combineValidators(validators),
        ns: ns
      }
      _adapters.push(newAdapter)

      for (var i = 0; i < _events.length; i++) {
        filteredAdapters = ut.filterAndSort(_events[i].args, [newAdapter])
        ut.triggerAll(_events[i].context, _events[i].args, filteredAdapters)
      }
      return ns ? this : or
    }
  }

  /* public methods */
  function adapt () {
    var context = this
    var args = ut.getArgs(arguments)
    var filteredAdapter = ut.filterAndSortOne(args, _adapters) // the most specific
    ut.countdown(filteredAdapter)
    _removeExaustedAdapters()
    return filteredAdapter.func.apply(context, args)
  }

  function all () {
    var context = this
    var args = ut.getArgs(arguments)
    var filteredAdapters = ut.filterAndSort(args, _adapters) // all matching adapters
    filteredAdapters.map(ut.countdown)
    _removeExaustedAdapters()
    return ut.getAll(context, args, filteredAdapters)
  }

  function trigger () {
    var context = this
    var args = ut.getArgs(arguments)
    var filteredAdapters = ut.filterAndSort(args, _adapters)
    filteredAdapters.map(ut.countdown)
    _removeExaustedAdapters()
    ut.triggerAll(context, args, filteredAdapters)
    return this.ns ? this : or
  }

  function stick () {
    var context = this
    var args = ut.getArgs(arguments)
    _events.push({ context: this, args: args })
    trigger.apply(context, args)
    return this.ns ? this : or
  }

  function size () {
    var args = ut.getArgs(arguments)
    var funcs = args.length ? ut.filterAndSort(args, _adapters) : _adapters
    return funcs.length
  }

  function merge () {
    var unFlattenedAdapters = Array.prototype.map.call(arguments, function (o) {
      return o.getAdapters()
    })
    var allAdapter = Array.prototype.concat.apply(_adapters, unFlattenedAdapters)

    var unFlattenedEvents = Array.prototype.map.call(arguments, function (o) {
      return o.getEvents()
    })
    var allEvents = Array.prototype.concat.apply(_events, unFlattenedEvents)
    return occamsrazor(allAdapter, allEvents)
  }

  function remove (func) {
    var ns = this.ns
    if (!func && !ns) {
      _adapters = []
      return or
    }
    _adapters = _adapters.filter(function (adapter) {
      if (func && ns) {
        return adapter.func !== func || adapter.ns !== ns
      } else if (func) {
        return adapter.func !== func
      } else if (ns) {
        return adapter.ns !== ns
      }
    })
    return ns ? this : or
  }

  function removeIf () {
    var args = ut.getArgs(arguments)
    var funcs = ut.filterAndSort(args, _adapters)
      .map(function (r) {
        return r.func
      })
    funcs.forEach(remove.bind(this))
    return this.ns ? this : or
  }

  function unstick () {
    var args = ut.getArgs(arguments)
    var validator = ut.combineValidators(args)
    _events = _events.filter(function (event) {
      return !validator(event.args)
    })
    return this.ns ? this : or
  }

  function proxy (id) {
    id = id || Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10)
    function Proxy (id) {
      this.ns = id
    }
    Proxy.prototype = or
    return new Proxy(id)
  }

  // returns a callable object
  function or () {
    var args = ut.getArgs(arguments)
    return adapt.apply(this, args)
  }

  or.adapt = adapt
  or.all = or.triggerSync = all
  or.add = or.on = getAdd()
  or.one = getAdd(1)
  or.size = size
  or.merge = merge
  or.remove = or.off = remove
  or.removeIf = removeIf
  or.trigger = trigger
  or.stick = stick
  or.unstick = unstick
  or.proxy = or.namespace = proxy

  or.getAdapters = function () { return _adapters }
  or.getEvents = function () { return _events }

  return or
}

module.exports = occamsrazor
