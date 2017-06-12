require('setimmediate');
var validator = require('occamsrazor-validator');
var wrapConstructor = require('./lib/wrap-constructor');

// add a function: func must be a function.
// validators is an array of validators
// functions is a list of obj (func, validators)
var _add = function (functions, validators, func, times, ns) {
  var i;
  for (i = 0; i < validators.length; i++) {
    if (typeof validators[i] === 'undefined') {
      validators[i] = validator();
    }
    else if (!(typeof validators[i] === 'function' && 'score' in validators[i])) {
      validators[i] = validator().match(validators[i]);
    }
  }

  functions.push({
    func: func,
    validators: validator.combine(validators),
    times: times,
    ns: ns
  });
  return functions.length;
};

// remove a func from functions
// functions is a list of obj (func, validators)
var _remove = function (functions, func, ns) {
  var i = 0, shouldRemove = false;

  if (!func && !ns) {
    functions.length = 0;
    return;
  }

  while (i < functions.length) {
    shouldRemove = false;
    if (func && ns) {
      shouldRemove = (functions[i].func === func) && (functions[i].ns === ns);
    } else if (func) {
      shouldRemove = functions[i].func === func;
    } else if (ns) {
      shouldRemove = functions[i].ns === ns;
    }
    if (shouldRemove) {
      functions.splice(i, 1);
    }
    else {
      i++;
    }
  }
};

var _removeAll = function (functions, funcs, ns) {
  for (var i = 0; i < funcs.length; i++) {
    _remove(functions, funcs[i], ns);
  }
};

var decorate_and_filter = function (args, functions) {
  var i, result, results = [];

  // get the score function
  // decorate
  for (i = 0; i < functions.length; i++) {
    result = functions[i].validators(args);
    // filter
    if (result) {
      result.payload = functions[i];
      results.push(result);
    }
  }
  return results;
};

var undecorate = function (results) {
  return results.map(function (r) {return r.payload;});
};

// get all the functions that validates with args. Sorted by score
// functions is a list of obj (func, validators)
var filter_and_sort = function (args, functions, onlyOne) {
  var results = decorate_and_filter(args, functions);

  if (onlyOne && results.length === 0) {
    throw new Error('Occamsrazor (get): Function not found');
  }

  // sort
  results.sort().reverse();

  if (onlyOne && results.length > 1 && results[0].toString() === results[1].toString()) {
    throw new Error('Occamsrazor (get): More than one adapter fits');
  }

  // undecorate
  return undecorate(results);
};

// manage countdown (really only using 1 for now)
var countdown = function (functions, func) {
  if (typeof func.times !== 'undefined') {
    func.times--;
    if (func.times === 0) {
      _remove(functions, func.func);
    }
  }
};

// call the function with the highest score between those
// that match with the arguments.
// The arguments must match with the validators of a registered function
// functions is a list of obj (func, validators)
var getOne = function (context, args, funcs, functions) {
  var out = funcs[0].func.apply(context, args);
  countdown(functions, funcs[0]);
  return out;
};

// call all the functions matching with the validators.
// Returns an array of results
var getAll = function (context, args, funcs, functions) {
  var i, out = [];
  for (i = 0; i < funcs.length; i++) {
    out.push(funcs[i].func.apply(context, args));
    countdown(functions, funcs[i]);
  }
  return out;
};

// main function
var _occamsrazor = function (adapterFuncs, stickyArgs) {
  var functions = adapterFuncs || [],
    stickyArguments = stickyArgs || [];

  var occamsrazor = function () {
    var args = Array.prototype.slice.call(arguments);
    var funcs = filter_and_sort(args, functions, true);
    return getOne(this, args, funcs, functions);
  };

  var getAdd = function (times) {
    return function () {
      var ns = this.ns;
      var funcs;
      var func = arguments[arguments.length - 1];
      var validators = arguments.length > 1 ? Array.prototype.slice.call(arguments, 0, -1) : [];

      var _func = typeof func === 'function' ? func : function () { return func; };

      var funcLength = _add(functions, validators, _func, times, ns);
      var _funcs = [functions[funcLength - 1]];

      for (var i = 0; i < stickyArguments.length; i++) {
        funcs = filter_and_sort(stickyArguments[i].args, _funcs);
        if (funcs.length === 0) continue;
        setImmediate(function (_stickyArgs, funcs) {
          return function () {
            getAll(_stickyArgs.context, _stickyArgs.args, funcs, _funcs);
          };
        }(stickyArguments[i], funcs));
      }
      return ns ? this : occamsrazor;
    };
  };

  occamsrazor.adapt = function adapt() {
    var args = Array.prototype.slice.call(arguments);
    var funcs = filter_and_sort(args, functions, true);
    return getOne(this, args, funcs, functions);
  };

  occamsrazor.on = occamsrazor.add = getAdd();
  occamsrazor.one =  getAdd(1);

  occamsrazor.size = function size() {
    return functions.length;
  };

  occamsrazor.merge = function merge() {
    var unFlattenAdapterFuncs = Array.prototype.map.call(arguments, function (adapter) {
      return adapter._functions();
    });
    var adapterFuncs = Array.prototype.concat.apply(functions, unFlattenAdapterFuncs);

    var unFlattenStickyArguments = Array.prototype.map.call(arguments, function (adapter) {
      return adapter._stickyArguments();
    });
    var stickyArguments = Array.prototype.concat.apply(functions, unFlattenStickyArguments);
    return _occamsrazor(adapterFuncs, stickyArguments);
  };

  occamsrazor._functions = function _functions() {
    return functions;
  };

  occamsrazor._stickyArguments = function _stickyArguments() {
    return stickyArguments;
  };

  occamsrazor.remove = occamsrazor.off = function remove(func) {
    var ns = this.ns;
    _remove(functions, func, ns);
    return ns ? this : occamsrazor;
  };

  occamsrazor.removeIf = function removeIf() {
    var args = Array.prototype.slice.call(arguments);
    var results = decorate_and_filter(args, functions);
    var funcs = undecorate(results).map(function (r) { return r.func; });
    var ns = this.ns;
    _removeAll(functions, funcs, ns);
    return ns ? this : occamsrazor;
  };

  occamsrazor.all = occamsrazor.triggerSync = function all() {
    var args = Array.prototype.slice.call(arguments);
    var funcs = filter_and_sort(args, functions);
    return getAll(this, args, funcs, functions);
  };

  occamsrazor.trigger = function trigger() {
    var args = Array.prototype.slice.call(arguments);
    var that = this;
    var funcs = filter_and_sort(args, functions);
    if (funcs.length) {
      setImmediate(function () {
        getAll(that, args, funcs, functions);
      });
    }
  };

  occamsrazor.stick = function stick() {
    var args = Array.prototype.slice.call(arguments);
    stickyArguments.push({context: this, args: args});
    var that = this;
    var funcs = filter_and_sort(args, functions);
    if (funcs.length) {
      setImmediate(function () {
        getAll(that, args, funcs, functions);
      });
    }
  };

  occamsrazor.proxy = occamsrazor.namespace = function proxy(id) {
    id = id || Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
    function Proxy(id) {
      this.ns = id;
    }
    Proxy.prototype = occamsrazor;
    return new Proxy(id);
  };

  return occamsrazor;
};

// registries
var _registries = typeof window == 'undefined' ? global : window;

if (!_registries._occamsrazor_registries) {
  _registries._occamsrazor_registries = {};
}

_registries = _registries._occamsrazor_registries;

var registry = function (registry_name) {
  registry_name = registry_name || 'default';
  var adapter = function (_registry) {
    return function (function_name) {
      if ( !( function_name in _registry) ) {
        _registry[function_name] = _occamsrazor();
      }
      return _registry[function_name];
    };
  };

  if ( !( registry_name in _registries) ) {
    _registries[registry_name] = {};
  }

  return adapter(_registries[registry_name]);
};

// public methods
_occamsrazor.adapters = _occamsrazor;
_occamsrazor.registry = registry;

_occamsrazor.wrapConstructor = wrapConstructor;

module.exports = _occamsrazor;
