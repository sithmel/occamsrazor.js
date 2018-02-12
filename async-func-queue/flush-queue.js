var globalObj = typeof window === 'undefined' ? global : window

function flushQueue (hiddenPropertyName, objectPropertyName) {
  var q = globalObj[hiddenPropertyName] || []
  delete globalObj[hiddenPropertyName]
  q.forEach(function (o) {
    globalObj[objectPropertyName][o.funcName].apply(o.ctx, o.args)
  })
}

module.exports = flushQueue
