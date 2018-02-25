require('setimmediate')
var validator = require('occamsrazor-validator')

function getArgs (a) {
  return Array.prototype.slice.call(a)
}

// a filter implementation
// that mutates the original array
function filterArray (arr, toKeep) {
  var i = 0
  while (i < arr.length) {
    if (toKeep(arr[i])) {
      i++
    } else {
      arr.splice(i, 1)
    }
  }
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

function notExausted (adapter) {
  return adapter.times !== 0
}

function getAll (context, args, adapters) {
  return adapters.map(function (adapter) {
    return adapter.func.apply(context, args)
  })
}

function triggerOne (context, args, func) {
  setImmediate(function () { func.apply(context, args) })
}

function triggerAll (context, args, adapters) {
  adapters.forEach(function (adapter) {
    triggerOne(context, args, adapter.func)
  })
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

// get all adapter that validates with args, with the highest score
// the result is a single adapter (func, validators)
function filterAndSortOne (args, adapters) {
  var results = decorateAndFilter(args, adapters)

  if (results.length === 0) {
    return
  }

  // sort
  results.sort().reverse()

  if (results.length > 1 && results[0].toString() === results[1].toString()) {
    throw new Error('Occamsrazor (get): More than one adapter fits')
  }

  // undecorate
  return undecorate(results)[0]
}

// get all the adapter that validates with args. Sorted by score
// the result is a list of adapters (func, validators)
function filterAndSort (args, adapters) {
  var results = decorateAndFilter(args, adapters)
  // sort
  results.sort().reverse()
  // undecorate
  return undecorate(results)
}

function binaryInsert (array, value, comparator, startVal, endVal) {
  var length = array.length
  var start = typeof startVal !== 'undefined' ? startVal : 0
  var end = typeof endVal !== 'undefined' ? endVal : length - 1 // !! endVal could be 0 don't use || syntax
  var m = start + Math.floor((end - start) / 2)

  if (length === 0 || !comparator) {
    array.push(value)
    return
  }

  if (comparator(value, array[end]) > 0) {
    array.splice(end + 1, 0, value)
    return
  }

  if (comparator(value, array[start]) < 0) { // !!
    array.splice(start, 0, value)
    return
  }

  if (start >= end) {
    return
  }

  if (comparator(value, array[m]) < 0) {
    binaryInsert(array, value, comparator, start, m - 1)
    return
  }

  if (comparator(value, array[m]) > 0) {
    binaryInsert(array, value, comparator, m + 1, end)
  }
}

module.exports = {
  getArgs: getArgs,
  combineValidators: combineValidators,
  getAll: getAll,
  triggerAll: triggerAll,
  triggerOne: triggerOne,
  countdown: countdown,
  filterAndSort: filterAndSort,
  filterAndSortOne: filterAndSortOne,
  filterArray: filterArray,
  notExausted: notExausted,
  binaryInsert: binaryInsert
}
