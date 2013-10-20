/*
Test initialization
*/


/*
Tests
*/
module( "Main", {
    setup: function (){
        this.is_instrument = function (obj){
            return 'instrument_name' in obj;
        };

        this.is_guitar = occamsrazor.chain(this.is_instrument, function (obj){
            return 'nStrings' in obj;
        });

        this.is_electricguitar = occamsrazor.chain(this.is_guitar, function (obj){
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
        this.is_number = function (obj){
            return typeof obj === 'number' && ! isNaN(obj);
        };

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
        this.is_instrument = function (obj){
            return 'instrument_name' in obj;
        };

        this.is_guitar = occamsrazor.chain(this.is_instrument, function (obj){
            return 'nStrings' in obj;
        });

        this.is_electricguitar = occamsrazor.chain(this.is_guitar, function (obj){
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

    var is_hello = occamsrazor.stringValidator('hello');
    ok(!!is_hello('hello'), 'string validator ok');
    ok(!is_hello('nothello'), 'string validator ko');

});

test("stringValidator using regexp", function() {

    var is_hello = occamsrazor.stringValidator(/hello/);
    ok(!!is_hello('hello'), 'string validator ok');
    ok(!!is_hello('ishello'), 'string validator ok');
    ok(!is_hello('ishelo'), 'string validator ko');

});

module( "this" );

test("stringValidator using string", function() {
    
    var hello = occamsrazor().add(function (){
        return "hello "  + this;
    });
    
    equal(hello.apply('world!'), 'hello world!', 'This works correctly!');

});

module( "isAnything" );

test("isAnything works", function() {
    
    ok(occamsrazor.isAnything({}), 'isAnything validator ok');

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
