var globalObj = typeof window === 'undefined' ? global : window

function buildFakeObject (hiddenPropertyName, objectPropertyName, funcs) {
  var fakeObj = {}
  funcs = Array.isArray(funcs) ? funcs : [funcs]
  var q = globalObj[hiddenPropertyName] = []
  funcs.forEach(function (funcName) {
    fakeObj[funcName] = function () {
      var args = Array.prototype.slice.call(arguments, 0)
      // check replacements in case someone did:
      // event = window.event
      if (fakeObj !== globalObj[objectPropertyName]) {
        return globalObj[objectPropertyName][funcName].apply(this, args)
      }
      q.push({ funcName: funcName, args: args, ctx: this })
      return fakeObj
    }
  })
  globalObj[objectPropertyName] = fakeObj
  return fakeObj
}

var attrs = [
  'add', 'on', 'one', 'remove',
  'off', 'removeIf', 'trigger',
  'stick', 'unstick', 'consume',
  'consumeOne'
]
// no: adapt, all, triggerSync, size, merge

function fakeOccamsrazor (hiddenPropertyName, objectPropertyName) {
  return buildFakeObject(hiddenPropertyName, objectPropertyName, attrs)
}

module.exports = fakeOccamsrazor
