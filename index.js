require('setimmediate');
var validator = require('occamsrazor-validator');
var wrapConstructor = require('./lib/wrap-constructor');

//add a function: func must be a function.
//validators is an array of validators
//functions is a list of obj (func, validators)
var _add = function (functions, validators, func, times, ns) {
  var i;
  for (i = 0; i < validators.length; i++){
    if (typeof validators[i] === undefined){
      validators[i] = validator();
    }
    else {
      if (!(typeof validators[i] === 'function' && 'score' in validators[i])) {
        validators[i] = validator().match(validators[i]);
      }
    }
  }

  functions.push({
    func: func,
    validators: validator.combine.apply(undefined, validators),
    times: times,
    ns: ns
  });
  return functions.length;
};

//remove a func from functions
//functions is a list of obj (func, validators)
var _remove = function (functions, func, ns) {
  var i = 0;

  if (!func && !ns) {
    functions.length = 0;
    return;
  }

  while (i < functions.length) {
    if ((func && ns) && (functions[i].func === func) && (functions[i].ns === ns)) {
      functions.splice(i, 1);
    }
    else if ((func && functions[i].func === func)) {
      functions.splice(i, 1);
    }
    else if ((ns && functions[i].ns === ns)) {
      functions.splice(i, 1);
    }
    else {
      i++;
    }
  }
};

//get all the functions that validates with args. Sorted by score
//functions is a list of obj (func, validators)
var filter_and_sort = function (args, functions, throwOnDuplicated) {
  var i, result, results = [];

  if (!functions.length) {
    return [];
  }
  //get the score function
  //decorate
  for (i = 0; i < functions.length; i++) {
    result = functions[i].validators.apply(undefined, args);
    //filter
    if (result) {
      result.payload = functions[i];
      results.push(result);
    }
  }
  //sort
  results.sort().reverse();

  if (throwOnDuplicated && results.length > 1 && results[0].toString() === results[1].toString()){
    throw new Error("Occamsrazor (get): More than one adapter fits");
  }

  //undecorate
  return results.map(function (r) {return r.payload;});
};

// manage countdown (really only using 1 for now)
var countdown = function (functions, func){
  if (typeof func.times !== "undefined"){
    func.times--;
    if (func.times === 0){
      _remove(functions, func.func);
    }
  }
}

//call the function with the highest score between those
//that match with the arguments.
//The arguments must match with the validators of a registered function
//functions is a list of obj (func, validators)
var getOne = function (args, functions, context) {
  var funcs = filter_and_sort(args, functions, true);
  if (!funcs.length) {
    throw new Error("Occamsrazor (get): Function not found");
  }
  var out = funcs[0].func.apply(context, args);
  countdown(functions, funcs[0]);
  return out;
};

// call all the functions matching with the validators.
// Returns an array of results
var getAll = function (args, functions, context) {
  var i, out = [],
  funcs = filter_and_sort(args, functions);
  for (i = 0; i < funcs.length; i++) {
    out.push(funcs[i].func.apply(context, args));
    countdown(functions, funcs[i]);
  }
  return out;
};

//main function
var _occamsrazor = function (adapterFuncs, stickyArgs) {
  var functions = adapterFuncs || [],
      stickyArguments = stickyArgs || [];

  var occamsrazor = function () {
    return getOne(Array.prototype.slice.call(arguments), functions, this);
  };

  var getAdd = function (times) {
    return function () {
      var ns = this.ns;
      var func = arguments[arguments.length - 1];
      var validators = arguments.length > 1 ? Array.prototype.slice.call(arguments, 0, -1) : [];
      if (typeof func !== 'function') {
        throw new Error("Occamsrazor (add): The last argument MUST be a function");
      }

      var funcLength = _add(functions, validators, func, times, ns);

      for (var i = 0; i < stickyArguments.length; i++) {
        setImmediate(function (_stickyArgs, _funcs) {
          return function () {
            getAll(_stickyArgs.args, _funcs, _stickyArgs.context);
          }
        }(stickyArguments[i], [functions[funcLength - 1]]));
      }
      return ns ? this : occamsrazor;
    };
  };

  occamsrazor.adapt = function adapt() {
    return getOne(Array.prototype.slice.call(arguments), functions, this);
  };

  occamsrazor.on = occamsrazor.add = getAdd();
  occamsrazor.one =  getAdd(1);

  occamsrazor.size = function size() {
    return functions.length;
  };

  occamsrazor.merge = function merge() {
    var unFlattenAdapterFuncs = Array.prototype.map.call(arguments, function (adapter){
      return adapter._functions();
    });
    var adapterFuncs = Array.prototype.concat.apply(functions, unFlattenAdapterFuncs)

    var unFlattenStickyArguments = Array.prototype.map.call(arguments, function (adapter){
      return adapter._stickyArguments();
    });
    var stickyArguments = Array.prototype.concat.apply(functions, unFlattenStickyArguments)
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

  occamsrazor.all = function all() {
    return getAll(Array.prototype.slice.call(arguments), functions, this);
  };

  occamsrazor.trigger = function trigger() {
    var args = Array.prototype.slice.call(arguments);
    setImmediate(function () {
      getAll(args, functions, this);
    });
  };

  occamsrazor.stick = function stick() {
    var args = Array.prototype.slice.call(arguments);
    stickyArguments.push({context: this, args: args});
    setImmediate(function () {
      getAll(args, functions, this);
    });
  };

  occamsrazor.proxy = function proxy(id) {
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
var _registries = typeof window == "undefined" ? global : window;

if(!_registries._occamsrazor_registries){
  _registries._occamsrazor_registries = {};
}

_registries = _registries._occamsrazor_registries;

var registry = function (registry_name){
  registry_name = registry_name || "default";
  var adapter = function (_registry){
    return function (function_name){
      if ( !( function_name in _registry) ){
        _registry[function_name] = _occamsrazor();
      }
      return _registry[function_name];
    };
  };

  if ( !( registry_name in _registries) ){
    _registries[registry_name] = {};
  }

  return adapter(_registries[registry_name]);
};

//public methods
_occamsrazor.adapters = _occamsrazor;
_occamsrazor.registry = registry;

_occamsrazor.wrapConstructor = wrapConstructor;

module.exports = _occamsrazor;
