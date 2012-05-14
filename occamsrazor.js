/******************************************************************************
 *
 * occamsrazor.0.1.js
 * by Maurizio Lupo
 *
 * http://sithmel.blogspot.com
 * @sithmel
 * maurizio.lupo gmail com
 *
 * LGPL 3 license
 * 13 May 2012
 *
 ******************************************************************************/

(function () {

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

    var score_array_to_str = function (score) {
            //convert an array in form [1,2,3] into a string "ABC" (easily sortable)
            var i, s = ""; //output string
            for (i = 0; i < score.length; i++) {
                s += String.fromCharCode(64 + score[i]);
            }
            return s;
        };


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

    /*
     * Component registry
     */
    var Reg = function () {
            this.components = {};
        };

    /*Add a function*/
    Reg.prototype.addFunc = function (name, func, validators) {
        if (!validators){
            validators = [];
        }
        if (!this.components[name]) {
            this.components[name] = [];
        }
        this.components[name].push({
            func: func,
            validators: validators
        });
        return func;
    };

    /*Delete a function*/
    Reg.prototype.delFunc = function (name, func) {
        //unregister a feature: registry.delFunc('monkeywrench')
        //unregister a function : registry.delFunc('monkeywrench', myfunction)
    
        var i, components = [];
        if (!func) {
            delete this.components[name];
            return;
        }
        
        for (i = 0; i < this.components[name].length; i++) {
            if (this.components[name][i].func !== func){
                components.push(this.components[name][i]);
            }
        }
        this.components[name] = components;
    };

    /*get all functions (private)*/
    Reg.prototype._getAllFunc = function (name, args) {
        var i, n, getScore, score, decorated_components = [],
            func, validators, funcs = [],
            components = this.components[name];
        if (!components) {
            return [];
        }
        //get the score function
        getScore = compute_score(args);
        //decorate    
        for (i = 0; i < components.length; i++) {
            func = components[i].func;
            validators = components[i].validators;
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

    /*It executes every function that match, returns all the results inside an array */
    Reg.prototype.executeAllFunc = function (name, args) {
        if (!args){
            args = [];
        }
        var i, out = [],
            components = this._getAllFunc(name, args);
        for (i = 0; i < components.length; i++) {
            out.push(components[i].apply(null, args));
        }
        return out;
    };

    /*It executes the most specific function, returns the result of the function */
    Reg.prototype.executeFunc = function (name, args) {
        if (!args){
            args = [];
        }
        var components = this._getAllFunc(name, args);
        return components[0].apply(null, args);
    };


    //public variables
    window.OCCAMSRAZOR = {};
    window.OCCAMSRAZOR.validator = validator;
    window.OCCAMSRAZOR.Registry = Reg;

}());
