/******************************************************************************
 *
 * occamsrazor.js
 * by Maurizio Lupo
 *
 * http://sithmel.blogspot.com
 * @sithmel
 * maurizio.lupo gmail com
 *
 * GPL license/MIT license
 * 29 Dec 2012
 *
 * version 2.1
 ******************************************************************************/


(function () {
    "use strict";

    // add isArray if not natively available
    if(!Array.isArray) {
      Array.isArray = function (vArg) {
        return Object.prototype.toString.call(vArg) === "[object Array]";
      };
    }
    
    //returns a validator (function that returns a score)
    var chain = function () {
        var validators = arguments;
        var closure = function (obj) {
            var i, score, total = 0;
            for (i = 0; i < validators.length; i++) {
                score = validators[i](obj);
                if (!score) {
                    return null;
                }
                total += score; // 1 + true === 2
            }
            return total;
        };
        return closure;
    };

    var stringValidator = function (s){
        if (typeof s !== 'string' && !(typeof s === 'object' && 'test' in s)){
            throw new Error("A stringValidator argument must be a string or a regular expression");
        }
       
        var closure = function (obj){
            var str = obj.toString();
            if (typeof s === 'string'){
                return str === s; //it is a string
            }
            else if (typeof s === 'object' && 'test' in s){
                return s.test(str);
            }
        };
        return closure;
    };

    var isAnything = function (obj){
        return true;
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
    var add = function (functions, func, validators) {
        var i;        
        if (typeof func !== 'function') {
            throw new Error("The last argument MUST be a function");
        }

        if (!validators) {
            validators = [];
        }
        if (!Array.isArray(validators)){
            validators = [validators];
        }
        for (i = 0; i < validators.length; i++){
            if (validators[i] === null){
                validators[i] = isAnything;
            }
            else if (typeof validators[i] !== 'function'){
                validators[i] = stringValidator(validators[i]);
            }
        }

        functions.push({
            func: func,
            validators: validators
        });
    };

    //remove a func from functions
    //functions is a list of obj (func, validators)
    var remove = function (functions, func) {
        var i, newfunctions = [];
        if (typeof func !== 'function') {
            throw new Error("The argument MUST be the function to delete");
        }

        for (i = 0; i < functions.length; i++) {
            if (functions[i].func !== func) {
                newfunctions.push(functions[i]);
            }
        }
        return newfunctions;
    };

    //get all the functions that validates with args. Sorted by score
    //functions is a list of obj (func, validators)
    var filter_and_sort = function (args, functions) {
        var i, n, getScore, score, decorated_components = [],
            func, validators, funcs = [];

        if (!functions.length) {
            return [];
        }
        //get the score function
        getScore = compute_score(args);
        //decorate    
        for (i = 0; i < functions.length; i++) {
            func = functions[i].func;
            validators = functions[i].validators;
            score = getScore(validators);
            //filter
            if (score) {
                // This hack leverages the lexicografy sorting order to sort
                // the components by their scores
                decorated_components.push([score_array_to_str(score), func]);
            }
        }
        //sort
        decorated_components.sort().reverse();
        //undecorate
        for (n = 0; n < decorated_components.length; n++) {
            funcs.push(decorated_components[n][1]);
        }
        return funcs;

    };

    //call the function with the highest score between those
    //that match with the arguments.
    //The arguments must match with the validators of a registered function
    //functions is a list of obj (func, validators)
    var getOne = function (args, functions, context) {
        var funcs = filter_and_sort(args, functions);
        if (!funcs.length) {
            throw new Error("Function not found");
        }
        return funcs[0].apply(context, args);
    };

    // call all the functions matching with the validators.
    // Returns an array of results
    var getAll = function (args, functions, context) {
        var i, out = [],
            funcs = filter_and_sort(args, functions);
        for (i = 0; i < funcs.length; i++) {
            out.push(funcs[i].apply(context, args));
        }
        return out;
    };

    //main function
    var occamsrazor = function () {
        var functions = [],
            occamsrazor = function () {
                return getOne(Array.prototype.slice.call(arguments), functions, this);
            };

        occamsrazor.on = occamsrazor.subscribe = occamsrazor.add = function (validators, func) {
            if (func === undefined){
                func = validators; //there is no validators!
                validators = [];
            }
            add(functions, func, validators);
            return occamsrazor;
        };

        occamsrazor.addConstructor = occamsrazor.addNew = function (validators, func) {
            if (func === undefined){
                func = validators; //there is no validators!
                validators = [];
            }
            add(functions, wrapConstructor(func), validators);
            return occamsrazor;
        };

        occamsrazor.remove = occamsrazor.off = function (func) {
            functions = remove(functions, func);
            return occamsrazor;
        };

        occamsrazor.publish = occamsrazor.all = function () {
            return getAll(Array.prototype.slice.call(arguments), functions, this);
        };


        return occamsrazor;
    };

    //public methods
    occamsrazor.chain = chain;
    occamsrazor.stringValidator = stringValidator;
    occamsrazor.adapters = occamsrazor;
    occamsrazor.isAnything = isAnything;
    occamsrazor.wrapConstructor = wrapConstructor;
 

    // Expose occamsrazor as an AMD module
    if (typeof define === "function" && define.amd) {
        define("occamsrazor", [], function () { return occamsrazor; });
    }
    // Expose occamsrazor as an UMD module (common.js)
    else if (typeof exports === 'object'){
        exports.occamsrazor = occamsrazor;
    }
    else if (typeof window === 'object'){
        // Expose occamsrazor to the browser global object
        window.occamsrazor = occamsrazor;
    }

}());

