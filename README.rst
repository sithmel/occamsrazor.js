occamsrazor.js: a component registry
=================================
Occam's Razor: 
This principle is often summarized as "other things being equal, a simpler explanation is better than a more complex one."
http://en.wikipedia.org/wiki/Occam%27s_razor

Ok this name can be a little pretentious but I think it can effectively describe a library capable to find the most appropriate answer (function) from a series of assumptions (validators).

What is a component architecture
================================
If you already know Zope 3 and its component architecture you can find here many similarities.
A component architecture uses a registry to decouple a functionality from the code that provides it.
It allows to adapts the functionality based on the features of the objects you are using.
For example: in the real world if you have to cut an object you have to use a different tool whether your object is a piece of paper of an iron bar.

Another popular approach to this kind of problems is to use object inheritance or monkey patching. Unfortunately these approaches have proven to have many problems (namespace pollution, difficulties to test in isolation).

How it works
============
Our goal is to call the most appropriate function that provides a functionality. Functionalities are labeled with simple strings. Let's say we have a feature called "player".
We must supply a validators for each argument to register this function ::

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


A validator checks a specific aspect of an object. Validators can be declared using "OCCAMSRAZOR.validator". This function also allows you to chain a group of validator together.
A validator returns a value of 0 (if the object doesn't pass every validators) or equal to the length of the chain. For example the validator is_guitar can be used to check if an object is an instrument AND a guitar at the same time. An object pass this validator returning a value of 2 otherwise it returns 0.
On the other hand is_electricguitar chain 3 different validator and returns 3 (all three validator returns true) or 0.
The value returned shows the specificity of the object.

You can use a validator to check if an object provides specific functionalities ::

    var guitar = {
        instrument_name : 'guitar',
        nStrings : 6
    };

    var electricguitar = {
        instrument_name : 'electric guitar',
        nStrings : 6, 
        ampli : 'marshall'
    };

    var a = !! is_electricguitar(guitar);
    // returns false

    var a = !! is_guitar(guitar);
    // returns true


A function is registered with a name (it represents the functionality provided), the function itself, and an array of validators one for each argument::

    var folkGuitarPlayer = function (guitar){
        return 'Strumming with ' + guitar.instrument_name;
    };

    var rockGuitarPlayer = function (guitar){
        return 'A solo with ' + guitar.instrument_name + ' and ' + guitar.ampli;
    };

    var registry = new OCCAMSRAZOR.Registry();

    registry.addFunc('player', folkGuitarPlayer, [is_guitar]);
    registry.addFunc('player', rockGuitarPlayer, [is_electricguitar]);


When you need a certain functionality you can ask it to the registry passing the name and the arguments. The registry will call the most appropriate function and returns the result::

    var guitarplayer = registry.executeFunc('player',[guitar]);

    alert(guitarplayer); // "Strumming with guitar"

    var eguitarplayer = registry.executeFunc('player',[electricguitar]);

    alert(eguitarplayer); // "A solo with eletric guitar and marshall"

In this other example the "component" is a simple function ::

    var is_an_equine = validator(function (obj){
        return 'hoofs' in obj;
    });

    var is_a_zebra = validator(is_an_equine, function (obj){
        return 'stripes' in obj;
    });

    registry.addFunc('what_animal',
                     function (s){ return s.toString()  + " is a horse"},
                     [is_an_equine]);

    registry.addFunc('what_animal',
                     function (s){ return s.toString()  + " is a zebra"},
                     [is_a_zebra]);

    var horse = {
        name: "ribot",
        hoofs: 4
    };
    
    var zebra = {
        name: "clara",
        hoofs: 4,
        stripes: "many"
    };
    

    registry.executeFunc('what_animal', [horse]);
    "ribot is a horse!"

    registry.getComponent('what_animal', [zebra]);
    "clara is a zebra!"

In order to write validators you can use duck typing, type checking or whatever check you want to use::

    // duck typing
    var has_wings = validator(function (obj){
        return 'wings' in obj;
    });

    //type checking
    var is_a_car = validator(function (obj){
        return Car.prototype.isPrototypeOf(obj);
    });

    //other
    var is_year = validator(function (obj){
        var re = /[0-9]{4}/;
        return !!obj.match(re);
    });

How this is related to Zope 3 component architecture
====================================================
This library tries to provide the same functionality of the ZCA (zope component architecture). The approach however is quite different: it is based on duck typing instead of interfaces.




