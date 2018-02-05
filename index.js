var occamsrazor = require('./lib/occamsrazor')
var wrapConstructor = require('./lib/wrap-constructor')
var registry = require('./lib/registry')

// public methods
occamsrazor.adapters = occamsrazor
occamsrazor.registry = registry
occamsrazor.wrapConstructor = wrapConstructor
module.exports = occamsrazor
