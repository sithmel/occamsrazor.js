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
 * 1 Aug 2012
 *
 * version 1.0
 ******************************************************************************/


(function (window) {
    "use strict";
    //returns a validator (function that returns a score)
    var validator = function () {
        var validators = arguments;
        var closure = function (obj) {
            var i, score, total = 0;
            for (i = 0; i < validators.length; i++) {
                score = validators[i](obj);
                if (!score) {
                    return null;
                }
                total += score;
            }
            return total;
        };
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
            var i, current_score, score = [];
            if (args.length !== validators.length) {
                return null;
            }
            for (i = 0; i < args.length; i++) {
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

        if (typeof func !== 'function') {
            throw new Error("The last argument MUST be a function");
        }

        if (!validators) {
            validators = [];
        }

        if (typeof validators === 'function') {
            validators = [validators];
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
                // the components by score
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
    var getOne = function (args, functions) {
        var funcs = filter_and_sort(args, functions);
        if (!funcs.length) {
            throw new Error("Function not found");
        }
        return funcs[0].apply(null, args);
    };

    // call all the functions matching with the validators.
    // Returns an array of results
    var getAll = function (args, functions) {
        var i, out = [],
            funcs = filter_and_sort(args, functions);
        for (i = 0; i < funcs.length; i++) {
            out.push(funcs[i].apply(null, args));
        }
        return out;
    };

    //main function
    var occamsrazor = function () {
        var functions = [],
            occamsrazor = function () {
                return getOne(Array.prototype.slice.call(arguments), functions);
            };

        occamsrazor.add = function (func, validators) {
            add(functions, func, validators);
            return occamsrazor;
        };

        occamsrazor.remove = function (func) {
            functions = remove(functions, func);
            return occamsrazor;
        };

        occamsrazor.all = function () {
            return getAll(Array.prototype.slice.call(arguments), functions);
        };


        return occamsrazor;
    };

    //public methods
    occamsrazor.validator = validator;
    occamsrazor.adapters = occamsrazor;

    // Expose occamsrazor to the global object
    window.occamsrazor = occamsrazor;

    // Expose occamsrazor as an AMD module
    if (typeof define === "function" && define.amd) {
        define("occamsrazor", [], function () { return occamsrazor; });
    }

}(window));

