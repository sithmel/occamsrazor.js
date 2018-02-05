var occamsrazor = require('./occamsrazor')

// registries
var _registries = typeof window === 'undefined' ? global : window

if (!_registries._occamsrazor_registries) {
  _registries._occamsrazor_registries = {}
}

_registries = _registries._occamsrazor_registries

function registry (registryName) {
  registryName = registryName || 'default'
  var adapter = function (_registry) {
    return function (functionName) {
      if (!(functionName in _registry)) {
        _registry[functionName] = occamsrazor()
      }
      return _registry[functionName]
    }
  }

  if (!(registryName in _registries)) {
    _registries[registryName] = {}
  }

  return adapter(_registries[registryName])
}

module.exports = registry
