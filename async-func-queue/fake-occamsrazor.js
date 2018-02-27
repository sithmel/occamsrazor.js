function buildFakeObject (hiddenPropertyName, objectPropertyName, globalObj, funcs) {
  globalObj = globalObj || (typeof window === 'undefined' ? global : window)
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

var defaultAttrs = [
  'add', 'on', 'one', 'remove',
  'off', 'removeIf', 'trigger', 'triggerSync',
  'stick', 'unstick', 'post', 'unpost', 'consume',
  'consumeOne'
]
// no: adapt, all, size, batch

function fakeOccamsrazor (hiddenPropertyName, objectPropertyName, globalObj, customAttrs) {
  return buildFakeObject(hiddenPropertyName, objectPropertyName, globalObj, defaultAttrs.concat(customAttrs))
}

module.exports = fakeOccamsrazor
