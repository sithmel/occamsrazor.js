/*
Test initialization
*/

var validator = OCCAMSRAZOR.validator;

var is_instrument = validator(function (obj){
    return 'instrument_name' in obj;
});

var is_guitar = validator(is_instrument, function (obj){
    return 'nStrings' in obj;
});

var is_electricguitar = validator(is_guitar, function (obj){
    return 'ampli' in obj;
});

var instrument = {instrument_name : 'instrument'};

var drum   = {
    instrument_name : 'instrument',
    crash : 'tin tin'
};

var guitar = {
    instrument_name : 'guitar',
    nStrings : 6
};

var electricguitar = {
    instrument_name : 'electric guitar',
    nStrings : 6, 
    ampli : 'marshall'
};

var folkGuitarPlayer = function (guitar){
    return 'Strumming with ' + guitar.instrument_name;
};

var rockGuitarPlayer = function (guitar){
    return 'A solo with ' + guitar.instrument_name + ' and ' + guitar.ampli;
};

var registry = new OCCAMSRAZOR.Registry();


registry.addFunc('player', folkGuitarPlayer, [is_guitar]);
registry.addFunc('player', rockGuitarPlayer, [is_electricguitar]);

/*
Tests
*/

test("Test validation (sometimes valid)", function() {
    ok( !! is_electricguitar(guitar) === false, "Guitar is not electric" );
    ok( !! is_guitar(guitar) === true, "Guitar is ... a guitar" );
});

test("Test validation (not valid)", function() {
    ok( !! is_electricguitar(drum) === false, "Drum is not an electric guitar" );
    ok( !! is_guitar(drum) === false, "Drum is not a guitar" );
});

test("Test validation (valid)", function() {
    ok( !! is_electricguitar(electricguitar) === true, "Electric Guitar is an electric guitar" );
    ok( !! is_guitar(electricguitar) === true, "Electric Guitar is a guitar" );
});

test("Execute function", function() {
    equals(registry.executeFunc('player',[guitar]) , 'Strumming with guitar' ,"Execute guitar function" );
});

test("Execute function (pick a specific function)", function() {
    equals(registry.executeFunc('player',[electricguitar]) , 'A solo with electric guitar and marshall' ,"Execute electric guitar function" );
});
    
test("Execute all functions (just one result)", function() {
    var results = registry.executeAllFunc('player',[guitar]);
    equals(results.length, 1, "Just one result");
    equals(results[0] , 'Strumming with guitar' ,"Execute guitar function" );
});

test("Execute all functions (more than one result)", function() {
    var results = registry.executeAllFunc('player',[electricguitar]);

    equals(results.length, 2, "Two results");
    equals(results[1]  , 'Strumming with electric guitar' ,"Execute electric guitar function" );
    equals(results[0] , 'A solo with electric guitar and marshall' ,"Execute guitar function" );
});

test("Delete a function", function() {
    registry.delFunc('player', folkGuitarPlayer);
    var results = registry.executeAllFunc('player',[electricguitar]);

    equals(results.length, 1, "One results");
    equals(results[0] , 'A solo with electric guitar and marshall' ,"Execute guitar function" );
});

test("Delete a functionality", function() {
    registry.delFunc('player');
    var results = registry.executeAllFunc('player',[electricguitar]);

    equals(results.length, 0, "No results");
});

/*
Test without validators
*/

registry.addFunc('print_test', function (){return 'test'});

test("Execute a function without arguments", function() {
    equals(registry.executeFunc('print_test') , 'test' ,"Print test" );
});

/*
Test with more than one validators (and argument)
*/

var is_number = validator(function (obj){
    return typeof obj === 'number' && ! isNaN(obj)
});

registry.addFunc('sum', function (a,b,c){return a+b+c}, [is_number, is_number, is_number]);

test("Execute a function with 3 arguments", function() {
    equals(registry.executeFunc('sum', [1,2,3]) , 6 ,"Sum is 6" );
});

