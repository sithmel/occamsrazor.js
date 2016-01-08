/******************************************************************************
*
* occamsrazor.js
* by Maurizio Lupo (sithmel)
*
******************************************************************************/

(function () {
  "use strict";

  // add isArray if not natively available
  if(!Array.isArray) {
    Array.isArray = function (vArg) {
      return Object.prototype.toString.call(vArg) === "[object Array]";
    };
  }

  var isAnything = function (obj){
    return true;
  };

  var shortcut_validators = {
    match: function (o){
      var i, len, out = {};
      if (typeof o === 'string' || typeof o === 'number' || typeof o === 'boolean' || o === null) {
        return function (s){
          return s === o;
        };
      }
      else if (o instanceof RegExp) {
        return function (s){
          return o.test(s);
        };
      }
      else if (typeof o === 'function'){
        return o;
      }
      else if (Array.isArray(o)){
        for(i = 0, len = o.length; i < len;i++){
          if (typeof o[i] !== 'string'){
            throw new Error("Occamsrazor (match): The argument can be a string, number, boolean, null, regular expression, a function, an object or an array of strings");
          }
          out[o[i]] = undefined;
        }
        return shortcut_validators.match(out);
      }
      else if (typeof o === 'object'){
        return function (obj){
          if (typeof obj !== "object") return false;
          for (var k in o){
            if (!(k in obj)) return false;
            if (typeof o[k] !== 'undefined'){
              if (!shortcut_validators.match(o[k])(obj[k])){
                return false;
              }
            }
            // undefined continue
          }
          return true;
        };
      }
      throw new Error("Occamsrazor (match): The argument can be a string, number, boolean, null, regular expression, a function, an object or an array of strings");
    },
    isPrototypeOf: function (proto){
      return function (obj){return proto.isPrototypeOf(obj);};
    },
    isInstanceOf: function (constructor){
      return function (obj){return obj instanceof constructor;};
    }
  };

  var _validator = function (baseScore, funcs){
    var k;
    funcs = funcs || [isAnything];
    var v = function validator(obj){
      var i, score, total = 0;
      for (i = 0; i < funcs.length; i++) {
        score = funcs[i](obj);
        if (!score) {
          return null;
        }
        total += score; // 1 + true === 2
      }
      return total + baseScore;
    };

    v.prototype = {
      toString: function (){
        return "validator";
      }
    };

    v.chain = function (func){
      return _validator(baseScore, funcs.concat(func));
    };

    v.score = function (){
      return funcs.length + baseScore;
    };

    v.important = function(bump){
      bump = bump || 64;
      return _validator(baseScore + bump, funcs);
    };

    // shortcut validators
    for (k in shortcut_validators){
      v[k] = (function (f){
        return function (){
          var args = Array.prototype.slice.call(arguments);
          return v.chain(f.apply(null, args));
        };
      }(shortcut_validators[k]));
    }

    return v;
  };

  //returns a validator (function that returns a score)
  var validator = function (){
    return _validator(0);
  };

  var wrapConstructor = function (Constructor){
    function closure(){
      var newobj, out,
      New = function (){};
      New.prototype = Constructor.prototype;
      newobj = new New;
      newobj.constructor = Constructor;
      out = Constructor.apply(newobj, Array.prototype.slice.call(arguments));
      if (out === undefined){
        return newobj;
      }
      return out
    }
    return closure;
  };

  //convert an array in form [1,2,3] into a string "ABC" (easily sortable)
  var score_array_to_str = function (score) {
    var i, s = ""; //output string
    for (i = 0; i < score.length; i++) {
      s += String.fromCharCode(64 + score[i]);
    }
    return s;
  };

  //given a list of arguments returns a function that compute a score
  //from a list of validators
  var compute_score = function (args) {
    var closure = function (validators) {
      var i, l, current_score, score = [];
      if (args.length < validators.length) {
        return null;
      }
      for (i = 0, l = validators.length; i < l; i++) {
        current_score = validators[i](args[i]);
        if (!current_score) {
          return null;
        }
        score.push(current_score);
      }
      return score;
    };
    return closure;
  };

  //add a function: func must be a function.
  //validators is an array of validators
  //functions is a list of obj (func, validators)
  var _add = function (functions, validators, func, times) {
    var i;
    for (i = 0; i < validators.length; i++){
      if (validators[i] === null){
        validators[i] = validator();
      }
      else if (validators[i].toString() !== 'validator'){
        validators[i] = validator().match(validators[i]);
      }
    }

    functions.push({
      func: func,
      validators: validators,
      times: times
    });
  };

  //remove a func from functions
  //functions is a list of obj (func, validators)
  var _remove = function (functions, func) {
    var i = 0;

    while (i < functions.length){
      if (functions[i].func === func) {
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
    var i, n, getScore, score, decorated_components = [],
    validators, funcs = [];

    if (!functions.length) {
      return [];
    }
    //get the score function
    getScore = compute_score(args);
    //decorate
    for (i = 0; i < functions.length; i++) {
      validators = functions[i].validators;
      score = getScore(validators);
      //filter
      if (score) {
        // This hack leverages the lexicografy sorting order to sort
        // the components by their scores
        decorated_components.push([score_array_to_str(score), functions[i]]);
      }
    }
    //sort
    decorated_components.sort().reverse();

    if (throwOnDuplicated && decorated_components.length > 1 && decorated_components[0][0] === decorated_components[1][0]){
      throw new Error("Occamsrazor (get): More than one adapter fits");
    }

    //undecorate
    for (n = 0; n < decorated_components.length; n++) {
      funcs.push(decorated_components[n][1]);
    }
    return funcs;

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
  var _occamsrazor = function (adapterFuncs) {
    var functions = adapterFuncs || [],
    occamsrazor = function () {
      return getOne(Array.prototype.slice.call(arguments), functions, this);
    };

    occamsrazor.on = occamsrazor.add = function add() {
      var func = arguments[arguments.length - 1];
      var validators = arguments.length > 1 ? Array.prototype.slice.call(arguments, 0, -1) : [];
      if (typeof func !== 'function') {
        throw new Error("Occamsrazor (add): The last argument MUST be a function");
      }

      _add(functions, validators, func);
      return occamsrazor;
    };

    occamsrazor.one =  function one() {
      var func = arguments[arguments.length - 1];
      var validators = arguments.length > 1 ? Array.prototype.slice.call(arguments, 0, -1) : [];
      if (typeof func !== 'function') {
        throw new Error("Occamsrazor (add): The last argument MUST be a function");
      }

      _add(functions, validators, func, 1);
      return occamsrazor;
    };

    occamsrazor.size = function size() {
      return functions.length;
    };

    occamsrazor.merge = function merge() {
      var unFlattenAdapterFuncs = Array.prototype.map.call(arguments, function (adapter){
        return adapter._functions();
      });
      var adapterFuncs = Array.prototype.concat.apply(functions, unFlattenAdapterFuncs)
      return _occamsrazor(adapterFuncs);      
    };

    occamsrazor._functions = function _functions() {
      return functions;
    };

    occamsrazor.remove = occamsrazor.off = function remove(func) {
      if (typeof func !== 'function') {
        throw new Error("Occamsrazor (remove): The argument MUST be the function to delete");
      }
      _remove(functions, func);
      return occamsrazor;
    };

    occamsrazor.all = occamsrazor.trigger = function all() {
      return getAll(Array.prototype.slice.call(arguments), functions, this);
    };

    occamsrazor.notFound = function notFound(func) {
      if (typeof func !== 'function') {
        throw new Error("Occamsrazor (notFound): you should pass a function");
      }

      _add(functions, [], func);
      return occamsrazor;
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
          _registry[function_name] = occamsrazor();
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
  _occamsrazor.validator = validator;
  _occamsrazor.shortcut_validators = shortcut_validators;

  _occamsrazor.adapters = _occamsrazor;
  _occamsrazor.registry = registry;

  _occamsrazor.wrapConstructor = wrapConstructor;

  // Expose occamsrazor as an AMD module
  if (typeof define === "function" && define.amd) {
    define("occamsrazor", [], function () { return _occamsrazor; });
  }
  // Expose occamsrazor as an UMD module (common.js)
  else if (typeof exports === 'object'){
    module.exports = _occamsrazor;
  }
  else if (typeof window === 'object'){
    // Expose occamsrazor to the browser global object
    window.occamsrazor = _occamsrazor;
  }

}());
