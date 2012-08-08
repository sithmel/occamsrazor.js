/*
Test initialization
*/

var is_instrument = occamsrazor.validator(function (obj){
    return 'instrument_name' in obj;
});

var is_guitar = occamsrazor.validator(is_instrument, function (obj){
    return 'nStrings' in obj;
});

var is_electricguitar = occamsrazor.validator(is_guitar, function (obj){
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

var player = occamsrazor()
    .add(folkGuitarPlayer, is_guitar)
    .add(rockGuitarPlayer, is_electricguitar);

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
    equals(player(guitar) , 'Strumming with guitar' ,"Execute guitar function" );
});

test("Execute function (pick a specific function)", function() {
    equals(player(electricguitar) , 'A solo with electric guitar and marshall' ,"Execute electric guitar function" );
});
    
test("Execute all functions (just one result)", function() {
    var results = player.all(guitar);
    equals(results.length, 1, "Just one result");
    equals(results[0] , 'Strumming with guitar' ,"Execute guitar function" );
});

test("Execute all functions (more than one result)", function() {
    var results = player.all(electricguitar);

    equals(results.length, 2, "Two results");
    equals(results[1]  , 'Strumming with electric guitar' ,"Execute electric guitar function" );
    equals(results[0] , 'A solo with electric guitar and marshall' ,"Execute guitar function" );
});

test("Delete a function", function() {
    player.remove(folkGuitarPlayer);
    var results = player.all(electricguitar);

    equals(results.length, 1, "One results");
    equals(results[0] , 'A solo with electric guitar and marshall' ,"Execute guitar function" );
});


/*
Test without validators
*/

var print_test = occamsrazor.adapter()
    .add(function (){return 'test'});

test("Execute a function without arguments", function() {
    equals(print_test() , 'test' ,"Print test" );
});

/*
Test with more than one validators (and argument)
*/

var is_number = occamsrazor.validator(function (obj){
    return typeof obj === 'number' && ! isNaN(obj)
});

var sum = occamsrazor()
    .add(function (a,b,c){
        return a+b+c;
    }, [is_number, is_number, is_number]);

test("Execute a function with 3 arguments", function() {
    equals(sum(1,2,3) , 6 ,"Sum is 6" );
});

