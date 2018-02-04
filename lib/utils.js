require('setimmediate')
var validator = require('occamsrazor-validator')

function getArgs (a) {
  return Array.prototype.slice.call(a)
}

function combineValidators (validators) {
  return validator.combine(validators.map(function (v) {
    if (typeof v === 'undefined') {
      return validator()
    } else if (!(typeof v === 'function' && 'score' in v)) {
      return validator().match(v)
    } else {
      return v
    }
  }))
}

function undecorate (results) {
  return results.map(function (r) { return r.payload })
}

function countdown (adapter) {
  adapter.times && adapter.times--
}

function getAll (context, args, adapters) {
  return adapters.map(function (adapter) {
    return adapter.func.apply(context, args)
  })
}

function triggerAll (context, args, adapters) {
  for (var i = 0; i < adapters.length; i++) {
    setImmediate((function (adapter) {
      return function () { adapter.func.apply(context, args) }
    }(adapters[i])))
  }
}

function decorateAndFilter (args, adapters) {
  var result
  var results = []

  // get the score function
  // decorate
  for (var i = 0; i < adapters.length; i++) {
    result = adapters[i].validators(args)
    // filter
    if (result) {
      result.payload = adapters[i]
      results.push(result)
    }
  }
  return results
}

function filterAndSortOne (args, adapters) {
  var results = decorateAndFilter(args, adapters)

  if (results.length === 0) {
    throw new Error('Occamsrazor (get): Function not found')
  }

  // sort
  results.sort().reverse()

  if (results.length > 1 && results[0].toString() === results[1].toString()) {
    throw new Error('Occamsrazor (get): More than one adapter fits')
  }

  // undecorate
  return undecorate(results)[0]
}

function filterAndSort (args, adapters) {
  var results = decorateAndFilter(args, adapters)
  // sort
  results.sort().reverse()
  // undecorate
  return undecorate(results)
}

module.exports = {
  getArgs: getArgs,
  combineValidators: combineValidators,
  getAll: getAll,
  triggerAll: triggerAll,
  countdown: countdown,
  filterAndSort: filterAndSort,
  filterAndSortOne: filterAndSortOne
}
