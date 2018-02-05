var globalObj = typeof window === 'undefined' ? global : window

function buildFakeObject (hiddenPropertyName, funcs) {
  var fakeObj = {}
  funcs = Array.isArray(funcs) ? funcs : [funcs]
  var q = globalObj[hiddenPropertyName] = []
  funcs.forEach(function (funcName) {
    fakeObj[funcName] = function () {
      var args = Array.prototype.slice.call(arguments, 0)
      q.push({ funcName: funcName, args: args, ctx: this })
      return fakeObj
    }
  })
  return fakeObj
}

var attrs = [
  'add', 'on', 'one', 'remove',
  'off', 'removeIf', 'trigger',
  'stick', 'unstick', 'consume'
]
// no: adapt, all, triggerSync, size, merge

function fakeOccamsrazor (hiddenPropertyName) {
  return buildFakeObject(hiddenPropertyName, attrs)
}

module.exports = fakeOccamsrazor
