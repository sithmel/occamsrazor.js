occamsrazor.js
==============
Occamsrazor.js helps you to use the adapter design pattern (http://en.wikipedia.org/wiki/Adapter_pattern)
It implements a system to discovery the most suitable adapter for one or more objects.

Its goal is to keep the code simple to extend and test.

Tutorial
========
Let's say we have some objects::

    var shape1 = {radius: 10};
    var shape2 = {radius: 5};
    var shape3 = {width: 5};

Every object represents a different shape. We need to calculate some properties of these objects. For example areas and perimeters.
Because every kind of shape needs different calculations, we create an adapter for every type of object::

    var circleMath = function (circle){
        return {
            area: function (){return circle.radius*circle.radius*Math.PI;},
            perimeter: function (){return 2*circle.radius*Math.PI;}
        };
    };

    var squareMath = function (square){
        return {
            area: function (){return square.width*square.width;},
            perimeter: function (){return 4*square.width;}
        };
    };

The problem is: how can we pick the right adapter for each shape ?

This is where occamsrazor.js enter.
First of all we need some validator. A validator will help to identify what shape represent an object::

    var has_radius = occamsrazor.validator().has('radius');
    var has_width = occamsrazor.validator().has('width');

I can use this validators to determine the kind of an object.
A shape has a radius ? It's a circle !
A shape has a width  ? It's a square !
That's it !

In this case we use attribute checking but we could use any kind of check (look at the the syntax).
Now we create a special function that wraps our adapters (we could call it an adapter registry)::

    var shapeMath = occamsrazor.adapters();

Then we add two adapters to our adapter registry::

    shapeMath.add(has_radius, circleMath);
    shapeMath.add(has_width, squareMath);

The first adapter should work for circles and the second for squares. The validators (has_radius and has_width) are used internally to pick the right adapter.
If you prefer you can chain the add methods together and/or use "occamsrazor" instead of "occamsrazor.adapters" (it's just a shorter alias)::

    var shapeMath = occamsrazor()
        .add(has_radius, circleMath)
        .add(has_width, squareMath);

From now on if we need an adapter for our objects we can do::

    var adapter = shapeMath(shape1);
    adapter.perimeter();

Conceptually an adapter is a function returning an object but nothing prevent you to write a function that returns a primitive type or nothing at all.

Why use adapters
================
Maybe you are thinking why using an adapter when I can just extend an object using prototype or copying attributes and methods.
There are two fundamentals problems with messing directly with objects:

- the method name we choose can conflicts with another one. Generally speaking patches can easily become incompatible between each others
- it's difficult to test an extension in isolation

Furthermore, using JSON, Javascript developers often deal with objects without methods and inheritance chains. So using adapters can fit nicely when you need to add behaviours to an object.

Adding a more specific adapter
==============================

Now we add another kind of shape, a rectangle::

    var shape4 = {width: 5, height: 6};

A rectangle has both width and height so we will define a more specific validator::

    var has_width_and_height = occamsrazor.validator().has('width').has('height');

Any time you extend a validator you get a new one so you could extend the previous one::

    var has_width_and_height = has_width.has('height');

A validator returns a positive number (score) to indicate how much is specific.
The score of this validator augment every time is chained with another function::

    var is_parallelepiped = has_width_and_height.has('depth');

This validator can return 4 (validate) or 0 (not validate).
The general rule is: a validator must return a positive number if the validation is positive or a Javascript falsy value if the validation is negative.
because of this, we can easily use validators to perform checks::

    !!has_width(shape1); // false
    !!has_radius(shape1); // true

As a matter of fact if you execute both has_width and has_width_and_height validators on shape4 they returns a positive number::

    has_width_and_height(shape4); // 3
    has_width(shape4);    // 2

You can also use the "score" method for getting the maximum score of a validator::

    has_width_and_height.score(); // 3
    has_width.score(); // 2

shape4 is both a rectangle and a square but the has_width_and_height validator is more specific.
Using this validator we can add another adapter::

    var rectangleMath = function (rectangle){
        return {
            area: function (){return rectangle.width*rectangle.height;},
            perimeter: function (){return 2*rectangle.width + 2*rectangle.height;}
        };
    };

    shapeMath.add(has_width_and_height, rectangleMath);

When you call the adapter registry it will returns the most specific adapter (based on the validator with the highest score)::

    var adapter = shapeMath(shape4); // rectangleMath(shape4)
    adapter.perimeter();

Default adapter
===============

If you call an adapter and there is no match with the registered functions you get an exception::

    shapeMath(not_a_shape); // it throws: new Error("Function not found")

It might happen that you need a generic adapter to be called, when no other adapter fit. You can register a default using notFound::

    shapeMath.notFound(function (){return;})
    shapeMath(not_a_shape); // returns undefined

Deleting an adapter
===================

If you want to delete an adapter you can use the "remove" method::

    shapeMath.remove(rectangleMath);

The remove method is chainable::

    shapeMath.remove(rectangleMath).remove(squareMath);

Multiadapters
=============
In the previous example we saw adapters that adapt a single object. We can also build multiadapters: adapters that adapts more than one object.

Let's make an example. I am writing a simple drawing program. This program draw different shapes in different context using either canvas, svg or DOM manipulation.
Each of these context has a different API and I am forced to write a different drawing subroutine. To manage the code easily I could use some multiadapters::

    var shapeDraw = occamsrazor.adapters();

    // draw a circle on canvas
    shapeDraw.add([has_radius, is_canvas], function (circle, canvasContext){
        ...
    });

    // draw a square on canvas
    shapeDraw.add([has_width, is_canvas], function (square, canvasContext){
        ...
    });

    // draw a circle on svg
    shapeDraw.add([has_radius, is_svg], function (circle, svgContext){
        ...
    });

    // draw a square on svg
    shapeDraw.add([has_width, is_svg], function (square, svgContext){
        ...
    });

    // draw a circle using DIVs
    shapeDraw.add([has_radius, is_dom], function (circle, domContext){
        ...
    });

    // draw a square using DIVs
    shapeDraw.add([has_width, is_dom], function (square, domContext){
        ...
    });

From now, if I want to draw something on any context I will use::

    var shape = {radius: 10},
        context = document.getElementByID('#drawing_space');

    painter = shapeDraw(shape, context);
    painter.draw();

The adapters machinery will do the rest executing the adapter with the highest score.

The score of multiadapters is calculated sorting the score of each validator in lexicographical order http://en.wikipedia.org/wiki/Lexicographical_order (like a dictionary).

Passing parameters to the adapter
=================================

You should notice from the previous examples that adapters takes as arguments the variables that pass the validation::

    shapeDraw.add([has_radius, is_canvas], function (circle, canvasContext){
    ...
    painter = shapeDraw(shape, context);

In this case a "circle" object and a "canvasContext" object. You can also call the adapter with some extra arguments::

    shapeDraw.add([has_radius, is_canvas], function (circle, canvasContext, strokecolor, fillcolor ){
    ...
    painter = shapeDraw(shape, context, 'red', 'black');

These extra arguments are not considered for the purpose of selecting the adapter.

Adding constructor functions to an adapter
==========================================

Occamsrazor.js works with constructor functions too ! just use the "addNew" method::

    Shape = occamsrazor
        .addNew(has_width, function (obj){
            this.width = obj.width;
            this.area = this.width * this.width;
        })
        .addNew(has_radius, function (obj){
            this.radius = obj.radius;
            this.area = 2 * this.radius * Math.PI;
        });

    var shape = new Shape({width: 5});

The prototype chain and "constructor" attribute should work as expected.
A little side effect is that the constructor could be called as a function::

    var shape = Shape({width: 5});


Getting all the adapters
========================
Sometimes we need to get back all the adapters, not just the more specific::
Imagine we need to build a sort of menu of shapes available on canvas::

    var shapeAdder = occamsrazor.adapters();

    var shapeAdder.add(is_canvas, function (canvas){
        return {
            name: 'rectangle',
            add: function (){
                return {width: 5, height: 6};
            }
        }
    });

    var shapeAdder.add(is_canvas, function (canvas){
        return {
            name: 'circle',
            add: function (){
                return {radius: 5};
            }
        }
    });

    var shapeAdder.add(is_canvas, function (canvas){
        return {
            name: 'circle',
            add: function (){
                return {width: 5};
            }
        }
    });

    var canvas_shapes = shapeAdder.all(canvas);

This will return an array containing all the adapters representing the shapes that can be painted to a canvas.

Implementing a Mediator with occamsrazor
========================================
The feature above allows to obtain a very useful "Mediator" object that implements pubblish/subscribe functions.
This is very useful to manage events in a centralized fashion.
Other information about the mediator design pattern are here: http://en.wikipedia.org/wiki/Mediator_pattern.
Let's see an example::

    var pubsub = occamsrazor();

    // this validators validate the the type of the event

    var is_selected_event = occamsrazor.validator().chain(function (evt){
        return evt === 'selected';
    });

    // the event is subscribed for the circle object only

    pubsub.add([is_selected_event, has_radius], function (evt, circle){
        console.log('Circle is selected');
    })


    pubsub.all('selected', circle);

To make the syntax more intuitive these functions have the alias subscribe and publish::


    pubsub.subscribe([is_selected_event,has_radius],
        function (evt, circle){
            console.log('Circle is selected');
        }
    );


    pubsub.publish('selected', circle);

To make everything simpler we can use a special feature (explained in the next section). If a validator must perform a simple string checking we can use the string instead of the validator function::

    pubsub.subscribe(["selected",has_radius],
        function (evt, circle){
            console.log('Circle is selected');
        }
    );


More about validators
=====================
A validator is a simple function. When it runs against an object, it usually returns a positive number if the validation is ok or 0 if it fails.
The number is an index of specificity. The number 1 is reserved for the most generic validation (useful for defaults).
General validators returns a number bigger than 1.
In order to write validators you can use duck typing, type checking or whatever check you want to use::

    // duck typing
    var has_wings = occamsrazor.validator().chain(function (obj){
        return 'wings' in obj;
    });

    //type checking
    var is_a_car = occamsrazor.validator().chain(function (obj){
        return Car.prototype.isPrototypeOf(obj);
    });

    //other
    var is_year = occamsrazor.validator().chain(function (obj){
        var re = /[0-9]{4}/;
        return !!obj.match(re);
    });

For writing easily a validator a few helper are available in the occamsrazor.shortcut_validators object::

    var is_hello = occamsrazor.validator().match('hello');

Validate a string equal to "hello". It uses the toString method to convert an object to its string representation.
It can be used even with regular expressions::

    var contains_nuts = occamsrazor.validator().match(/nut/);

If we pass a string or a regular expression instead of a validator function this string is automatically use this shortcut.
You can also use the "has" validator for checking if a property exists and isPrototypeOf::

    var has_wings = occamsrazor.validator().has('wings');
    var is_prototype_rect = occamsrazor.validator().isPrototypeOf(rect.prototype);

You can also chain them together::

    var is_prototype_rect_and_has_wings = occamsrazor.validator().isPrototypeOf(rect.prototype).has('wings');

Registries
==========
This helper function is useful to group adapters in registries::

    var mathregistry = occamsrazor.registry('math'),
        getArea = mathregistry('area_functions');

If a registry doesn't exist it is created and returned by the registry function.
If the adapter required doesn't exist it is created and returned too.
If you don't specify a specific registry you'll get the "default" registry::

    var registry = occamsrazor.registry();
        getArea = registry('area_functions');


Syntax and reference
====================

Importing occamsrazor.js
------------------------
Occamsrazor can be imported in a traditional way::

    <script src="lib/occamsrazor.js"></script>

or using AMD (require.js).
You can also use it in node.js::

    var occamsrazor = require('occamsrazor');

Validator function
------------------

Syntax::

    occamsrazor.validator();

Returns a generic validator. It will validate every object with score 1.

occamsrazor.validator().score
-----------------------------

Syntax::

    a_validator.score();

Returns the score returned by this validator. It can be useful for debugging or introspection.


occamsrazor.validator().chain
-----------------------------

Add a check to the validator, and increment the score by 1.

Syntax::

    var validator = occamsrazor.validator().chain(function (obj){//return true or false});

Arguments:

- a function taking an object and returning true or false

occamsrazor.validator().match
-----------------------------

Add a check if the object match a string or a regular expression.

Syntax::

    var validator = occamsrazor.validator().match(string);

    var validator = occamsrazor.validator().match(regular_expression);

occamsrazor.validator().has
---------------------------

Check if an object has one or more properties (optionally the values).

Syntax::

    var validator = occamsrazor.validator().has(propName);

        or

    var validator = occamsrazor.validator().has([propName1, propName2, ...]);

        or

    var validator = occamsrazor.validator().has({propName1: "string", propName2: {propName3: "string"}});

The third for allows to perform the validation checking recursively the properties of an object. Values of the map can have 3 different values:

    * undefined: check only if the key is defined
    * a string or a regular expression: the "match" validator will be used
    * an object: the subobject will be checked recursively

For example::

    var hasCenterX = occamsrazor.validator({center: {x: undefined}});
    // will match {center: {x: "10"}}

    var hasCenterX10 = occamsrazor.validator({center: {x: "10"}});
    // will match {center: {x: "10"}} but not {center: {x: "11"}}

occamsrazor.validator().isPrototypeOf
-------------------------------------
Check if an object is a prototype of another.

Syntax::

    var validator = occamsrazor.validator().isPrototypeOf(obj);

occamsrazor.validator().instanceOf
-------------------------------------
Check if an object is an instance of a constructor.

Syntax::

    var validator = occamsrazor.validator().instanceOf(ContructorFunc);

occamsrazor.shortcut_validators
-------------------------------
It is an object where you can add your shortcut validators.
"match", "has" and "isPrototypeOf" are added here but you can add your own if you need.

occamsrazor.adapters
--------------------

returns adapters.

Syntax::

    var adapters = occamsrazor.adapters();

or::

    var adapters = occamsrazor();

Adapters
========
A function/object returned from occamsrazor.adapter

Syntax::

    adapters([arg1, arg2 ...]);

take 0 or more arguments. It calls the most specific function for the arguments.

adapters.all (alias .publish)
-------------------------------------------------------

Syntax::

    adapters.all([arg1, arg2 ...]);

take 0 or more arguments. It calls every function that match with the arguments.
The results of the functions are returned inside an array.

adapters.add (alias .subscribe, .on)
---------------------------------------------------

Add a function and 0 or more validators to the adapters.
If the adapter takes more than one argument (a multiadapter) we must pass an array with all the validators.

Syntax::

    adapters.add(func)

    adapters.add(validator, func)

    adapters.add([an array of validators], func)

returns the adapters (this method can be chained). If the validator is a string or a regular expression is converted automatically to a function using occamsrazor.stringValidator
If a validator is null it become occamsrazor.validator().

adapters.notFound
---------------------------------------------------

Add a default function to the adapters.
This will be called whenever no others adapters fit.

Syntax::

    adapters.notFound(func)

returns the adapters (this method can be chained).

adapters.addNew (alias .addConstructor)
---------------------------------------------------

Add a constructor function and 0 or more validators to the adapters.
If the adapter takes more than one argument (a multiadapter) we must pass an array with all the validators.

Syntax::

    adapters.addNew(func)

    adapters.addNew(validator, func)

    adapters.addNew([an array of validators], func)

returns the adapters (this method can be chained). If the validator is a string or a regular expression is converted automatically to a function using occamsrazor.stringValidator
If a validator is null it is converted as occamsrazor.validator().

adapters.remove (alias .off)
------------------------------------
delete a function from the adapters. Syntax::

    adapters.remove(func);

returns the adapters (this method can be chained)

About the name
==============
The name of the library is taken from this philosophical principle:
Occam's Razor:
This principle is often summarized as "other things being equal, a simpler explanation is better than a more complex one."
http://en.wikipedia.org/wiki/Occam%27s_razor

Ok this name can be a little pretentious but I think it can effectively describe a library capable to find the most appropriate answer (adapter in this case) from a series of assumptions (validators).

A bit of history
================
If you already know Zope 3 and its component architecture you can find here many similarities.
This library tries to provide the same functionality of the ZCA (zope component architecture). The approach however is quite different: it is based on duck typing validators instead of interfaces.
I wrote about what I didn't like of Zope component architecture here (http://sithmel.blogspot.it/2012/05/occamsrazorjs-javascript-component.html)
