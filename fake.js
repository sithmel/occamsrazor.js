
function buildFakeObject (hiddenPropertyName, funcs) {
  var fakeObj = {}
  funcs = Array.isArray(funcs) ? funcs : [funcs]
  var q = window[hiddenPropertyName] = []
  funcs.forEach(function (funcName) {
    fakeObj[funcName] = function () {
      var args = Array.prototype.slice.call(arguments, 0)
      q.push({ funcName: funcName, args: args, ctx: this })
    }
  })
  return fakeObj
}

function flushQueue (q, realObject) {
  q = q || []
  q.forEach(function (o) {
    realObject[o.funcName].apply(o.ctx, o.args)
  })
}

var attrs = ['add', 'on', 'one', 'remove', 'off', 'removeIf', 'trigger', 'stick', 'unstick']
// no: adapt, all, triggerSync, size, merge
window.events = buildFakeObject('_eventsQueue', attrs)

flushQueue(window._eventsQueue, window.events)
