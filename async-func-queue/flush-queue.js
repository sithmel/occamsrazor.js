
function flushQueue (hiddenPropertyName, objectPropertyName, globalObj) {
  globalObj = globalObj || (typeof window === 'undefined' ? global : window)
  var q = globalObj[hiddenPropertyName] || []
  delete globalObj[hiddenPropertyName]
  q.forEach(function (o) {
    globalObj[objectPropertyName][o.funcName].apply(o.ctx, o.args)
  })
}

module.exports = flushQueue
