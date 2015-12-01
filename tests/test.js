/*
Test initialization
*/


/*
Tests
*/
module( "Main", {
    setup: function (){
        this.is_instrument = occamsrazor.validator().chain(function (obj){
            return 'instrument_name' in obj;
        });

        this.is_guitar = this.is_instrument.chain( function (obj){
            return 'nStrings' in obj;
        });

        this.is_electricguitar = this.is_guitar.chain(function (obj){
            return 'ampli' in obj;
        });

        this.instrument = {instrument_name : 'instrument'};

        this.drum   = {
            instrument_name : 'instrument',
            crash : 'tin tin'
        };

        this.guitar = {
            instrument_name : 'guitar',
            nStrings : 6
        };

        this.electricguitar = {
            instrument_name : 'electric guitar',
            nStrings : 6,
            ampli : 'marshall'
        };

        this.folkGuitarPlayer = function (guitar){
            return 'Strumming with ' + guitar.instrument_name;
        };

        this.rockGuitarPlayer = function (guitar){
            return 'A solo with ' + guitar.instrument_name + ' and ' + guitar.ampli;
        };

        this.player = occamsrazor()
            .add(this.is_guitar, this.folkGuitarPlayer)
            .add(this.is_electricguitar, this.rockGuitarPlayer);

    },
    teardown: function (){
    }
} );

test("Test validation (sometimes valid)", function() {
    ok( !! this.is_electricguitar(this.guitar) === false, "Guitar is not electric" );
    ok( !! this.is_guitar(this.guitar) === true, "Guitar is ... a guitar" );
});

test("Test validation (not valid)", function() {
    ok( !! this.is_electricguitar(this.drum) === false, "Drum is not an electric guitar" );
    ok( !! this.is_guitar(this.drum) === false, "Drum is not a guitar" );
});

test("Test validation (valid)", function() {
    ok( !! this.is_electricguitar(this.electricguitar) === true, "Electric Guitar is an electric guitar" );
    ok( !! this.is_guitar(this.electricguitar) === true, "Electric Guitar is a guitar" );
});

test("Execute function", function() {
    equals(this.player(this.guitar) , 'Strumming with guitar' ,"Execute guitar function" );
});

test("Execute function (pick a specific function)", function() {
    equals(this.player(this.electricguitar) , 'A solo with electric guitar and marshall' ,"Execute electric guitar function" );
});

test("Execute all functions (just one result)", function() {
    var results = this.player.all(this.guitar);
    equals(results.length, 1, "Just one result");
    equals(results[0] , 'Strumming with guitar' ,"Execute guitar function" );
});

test("Execute all functions (more than one result)", function() {
    var results = this.player.all(this.electricguitar);

    equals(results.length, 2, "Two results");
    equals(results[1]  , 'Strumming with electric guitar' ,"Execute electric guitar function" );
    equals(results[0] , 'A solo with electric guitar and marshall' ,"Execute guitar function" );
});

test("Delete a function", function() {
    this.player.remove(this.folkGuitarPlayer);
    var results = this.player.all(this.electricguitar);

    equals(results.length, 1, "One results");
    equals(results[0] , 'A solo with electric guitar and marshall' ,"Execute guitar function" );
});

test("Passing extra arguments", function() {
    equals(this.player(this.guitar, 'extra') , 'Strumming with guitar' ,"Execute guitar function and passing an extra argument" );

});


/*
Test without validators
*/
module( "Test without validators", {
    setup: function (){
        this.print_test = occamsrazor.adapters()
            .add(function (){return 'test'});
    }
});


test("Execute a function without arguments", function() {
    equals(this.print_test() , 'test' ,"Print test" );
});

/*
Test with more than one validators (and argument)
*/
module( "Test more than one validator", {
    setup: function (){
        this.is_number = occamsrazor.validator().chain(function (obj){
            return typeof obj === 'number' && ! isNaN(obj);
        });

        this.sum = occamsrazor()
            .add([this.is_number, this.is_number, this.is_number], function (a,b,c){
                return a+b+c;
            });
    }
});


test("Execute a function with 3 arguments", function() {
    equals(this.sum(1,2,3) , 6 ,"Sum is 6" );
});


/*
Use occamsrazor.js with observer pattern

testing
*/
module( "Pubsub and default stringvalidator", {
    setup: function (){
        this.is_instrument = occamsrazor.validator().chain(function (obj){
            return 'instrument_name' in obj;
        });

        this.is_guitar = this.is_instrument.chain(function (obj){
            return 'nStrings' in obj;
        });

        this.is_electricguitar = this.is_guitar.chain( function (obj){
            return 'ampli' in obj;
        });


        this.guitar = {
            instrument_name : 'guitar',
            nStrings : 6
        };

        this.electricguitar = {
            instrument_name : 'electric guitar',
            nStrings : 6,
            ampli : 'marshall'
        };

        this.pubsub = occamsrazor();

        this.pubsub.subscribe(['play', this.is_guitar], function (evt, instrument){
            return 'Strumming ' + instrument.instrument_name;
        });

        this.pubsub.subscribe(['play', this.is_electricguitar], function (evt, instrument){
            return instrument.instrument_name + ' solo';
        });

        this.pubsub.subscribe(['stop', this.is_guitar], function (evt, instrument){
            return 'stop playing';
        });
    }
});



test("Notify an event with 2 handler", function() {

    var outputs = this.pubsub.publish('play', this.electricguitar);
    ok(outputs.indexOf('Strumming electric guitar') !== -1, 'Called first handler');
    ok(outputs.indexOf('electric guitar solo') !== -1, 'Called second handler');
    equals(outputs.length, 2, 'Just 2 outputs');
});

test("Notify an event with 1 handler", function() {

    var outputs = this.pubsub.publish('play', this.guitar);
    ok(outputs.indexOf('Strumming guitar') !== -1, 'Called handler');
    equals(outputs.length, 1, 'Just 1 output');

});

module( "stringValidator" );

test("stringValidator using string", function() {

    var is_hello = occamsrazor.validator().match('hello');
    ok(!!is_hello('hello'), 'string validator ok');
    ok(!is_hello('nothello'), 'string validator ko');

});

test("stringValidator using regexp", function() {

    var is_hello = occamsrazor.validator().match(/hello/);
    ok(!!is_hello('hello'), 'string validator ok');
    ok(!!is_hello('ishello'), 'string validator ok');
    ok(!is_hello('ishelo'), 'string validator ko');

});

module( "this" );

test("apply this to an adapter", function() {

    var hello = occamsrazor().add(function (){
        return "hello "  + this;
    });

    equal(hello.apply('world!'), 'hello world!', 'This works correctly!');

});

test("adapter as method", function() {
    var Factory = function (){
        this.greeting = 'world!';
    };

    Factory.prototype.method = occamsrazor().add(function (){
        return "hello "  + this.greeting;
    });

    var obj = new Factory;

    equal(obj.method(), 'hello world!', 'This works correctly!');


});


module( "isAnything" );

test("isAnything works", function() {

    ok(occamsrazor.validator()({}), 'isAnything validator ok');

});

test("isAnything is used when validator is null", function() {

    var works = occamsrazor().add(null, function (x){
        return x;
    });

    equals(works('anything'),'anything', 'used isAnything instead of null');

});

module( "wrapConstructor" );

test("decorator used internally to wrap a constructor function", function() {
    var Constructor = occamsrazor.wrapConstructor(function (x){
        this.x = x
    });

    equals(Constructor('anything').x,'anything', 'returns an object');
    equals(new Constructor('anything').x,'anything', 'returns an object');

});

test("checking prototype and constructor", function() {
    var Constructor = function (x){
        this.x = x;
    };
    Constructor.prototype.number = 10;

    var WrappedConstructor = occamsrazor.wrapConstructor(Constructor);

    var obj = WrappedConstructor('5');
    equals(obj.x,5, 'test args');
    equals(obj.number,10, 'test prototype');
    equals(obj.constructor,Constructor, 'test constructor');

    var obj = new WrappedConstructor('5');
    equals(obj.x,5, 'test args');
    equals(obj.number,10, 'test prototype');
    equals(obj.constructor,Constructor, 'test constructor');

});

test("adding a constructor function with addNew", function() {

    var Constructor = occamsrazor().addNew(function (x){
        this.x = x;
    });

    equals(Constructor('anything').x,'anything', 'returns an object');
    equals(new Constructor('anything').x,'anything', 'returns an object');

});

test("checking prototype and constructor with addNew", function() {
    var Constructor = function (x){
        this.x = x;
    };
    Constructor.prototype.number = 10;

    var WrappedConstructor = occamsrazor().addNew(Constructor);

    var obj = WrappedConstructor('5');
    equals(obj.x,5, 'test args');
    equals(obj.number,10, 'test prototype');
    equals(obj.constructor,Constructor, 'test constructor');

});

module( "registry" );

test("testing empty registry", function() {
    var test = occamsrazor.registry('main')('test');
    ok(test instanceof Function);
});

test("testing full registry", function() {
    var test1 = occamsrazor.registry('main')('test').add(function (){return 'ok'}),
        test2 = occamsrazor.registry('main')('test');
    equals(test2(), 'ok');
});

test("testing default registry", function() {
    var test1 = occamsrazor.registry()('test').add(function (){return 'ok'}),
        test2 = occamsrazor.registry()('test');
    equals(test2(), 'ok');
});

module( "notFound" );

test("full adapter hierarchy", function() {
    var isAnything = occamsrazor.validator();
    var isNumber = occamsrazor.validator().chain(function (obj){
      return typeof obj === "number";
    });

    var notValid = function (a){return "not valid";};
    var notFound = function (a){return "not found";};
    var square = function (a){return a*a;};

    var getSquare = occamsrazor()
    .notFound(notFound);

    equal(getSquare(2), "not found", "get specific adapter");

    getSquare
    .add(isAnything, notValid);

    equal(getSquare("a"), "not valid", "get less specific adapter");
    equal(getSquare(), "not found", "get fallback adapter");

    getSquare
    .add(isNumber, square);

    equal(getSquare(2), 4, "get specific adapter");
    equal(getSquare("a"), "not valid", "get less specific adapter");
    equal(getSquare(), "not found", "get fallback adapter");
});

module( "multiple matches" );

test("more than one adapter", function() {
    var isAnything = occamsrazor.validator();

    var func1 = function (a){return "func1";};
    var func2 = function (a){return "func2";};

    var test = occamsrazor()
    .add(isAnything, func1)
    .add(isAnything, func2);

    raises(test, "throws");
});

module( "validator score" );

test("more than one adapter", function() {
    var isAnything = occamsrazor.validator();
    var hasWidth = isAnything.has('width');
    var hasHeight_hasWidth = hasWidth.has('height');

    equal(isAnything.score(), 1, "isAnything has score of 1");
    equal(hasWidth.score(), 2, "hasWidth has score of 2");
    equal(hasHeight_hasWidth.score(), 3, "hasHeight_hasWidth has score of 3");
});

module( "validator type" );

test("validator metadata", function() {
  var isAnything = occamsrazor.validator();

  equal(isAnything.name, "validator", "name is correct");
});

module( "validator has" );

test("single/multiple -has-", function() {
    var isAnything = occamsrazor.validator();
    var hasWidth = isAnything.has('width');
    var hasHeight_hasWidth = isAnything.has(['width', 'height']);

    equal(isAnything.score(), 1, "isAnything has score of 1");
    equal(hasWidth.score(), 2, "hasWidth has score of 2");
    equal(hasHeight_hasWidth.score(), 2, "hasHeight_hasWidth has score of 2");

    equal(hasWidth({width: 1, height: 2}), 2, "match1");
    equal(hasHeight_hasWidth({width: 1, height: 2}), 2, "match2");
});

test("single/multiple -has- object", function() {
    var isAnything = occamsrazor.validator();
    var hasWidth10 = isAnything.has({'width': '10'});
    var hasX10 = isAnything.has({
      center: {
        x: "10", y: undefined
      }
    });

    equal(hasWidth10({width: "10"}), 2, "match");
    ok(!hasWidth10({width: 1}), "don't match");

    equal(hasX10({center: {x:"10", y:"1"}}), 2, "match");
    ok(!hasX10({center: {x:"11", y:"1"}}), "don't match");
    ok(!hasX10({center: {x:"10"}}), "don't match");
    ok(!hasX10({center: "1"}), "don't match");

});

test("-has- can use functions", function() {
  var isAnything = occamsrazor.validator();
  var hasWidthbetween5and10 = isAnything.has({width: function (w){
    return w >= 5 && w <=10;
  }});

  equal(hasWidthbetween5and10({width: 8}), 2, "match");
  equal(hasWidthbetween5and10({width: 12}), null, "don't match");
  equal(hasWidthbetween5and10({width: 4}), null, "don't match");

});
