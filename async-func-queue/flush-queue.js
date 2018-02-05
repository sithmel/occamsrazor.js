var globalObj = typeof window === 'undefined' ? global : window

function flushQueue (hiddenPropertyName, realObject) {
  var q = globalObj[hiddenPropertyName] || []
  delete globalObj[hiddenPropertyName]
  q.forEach(function (o) {
    realObject[o.funcName].apply(o.ctx, o.args)
  })
}

module.exports = flushQueue
