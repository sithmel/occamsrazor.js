Occamsrazor
===========
Occamsrazor helps you to use the adapter design pattern (http://en.wikipedia.org/wiki/Adapter_pattern)
It implements a system to discovery the most suitable adapter for one or more objects.

Its goal is to keep the code simple to extend and test.

Tutorial
========
Let's say you have some objects::

    var shape1 = {radius: 10};
    var shape2 = {radius: 5};
    var shape3 = {width: 5};

Every object represents a different shape. You need to calculate some properties of these objects. For example areas and perimeters.
Because every type of shape needs different calculations, you create an adapter for every type of object::

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

The problem is: how can you pick the right adapter for each shape ?

This is where occamsrazor enter.
First of all you need some validator. A validator will help to identify what "shape" of the object::

    var has_radius = occamsrazor.validator().match(['radius']);
    var has_width  = occamsrazor.validator().match(['width']);

Don't worry about the syntax for now. It is explained below.
These two, match for objects with a "radius" or "width" attribute respectively.
Now create a special function that wraps the adapters (you could call it an adapter registry)::

    var shapeMath = occamsrazor.adapters();

Then add two adapters to our adapter registry::

    shapeMath.add(has_radius, circleMath);
    shapeMath.add(has_width, squareMath);

The first adapter will work for circles and the second for squares. The validators (has_radius and has_width) are used internally to pick the right adapter.
If you prefer you can chain the add methods together and/or use "occamsrazor" instead of "occamsrazor.adapters" (it's just a shorter alias)::

    var shapeMath = occamsrazor()
        .add(has_radius, circleMath)
        .add(has_width, squareMath);

From now on if you need an adapter for your objects you can do::

    var adapter = shapeMath(shape1);
    adapter.perimeter();

Conceptually an adapter is a function returning an object but nothing prevents you to write a function that returns a primitive type or nothing at all.

Why use adapters
================
Maybe you are thinking why using an adapter when I can just extend an object using its prototype or copying attributes and methods.
There are two fundamentals problems with messing directly with objects:

- the method name we choose can conflicts with another one. Generally speaking patches can easily become incompatible between each others
- it's difficult to test an extension in isolation

Using adapters promotes the open/close principle (https://en.wikipedia.org/wiki/Open/closed_principle). They are easy to test and they allow to add functionalities without changing already tested code base.

More about validators
=====================
Ultimately a validator is a function. When it runs against an object, it returns a falsy value or a score.
The falsy value means that an object doesn't fit in the validator's constraints.
The score represent how well the object fits (its specificity). For example::

    var isAnything = occamsrazor.validator();

occamsrazor.validator() creates the simplest validator. It matches anything with score 1::

    isAnything('hello'); // returns 1
    isAnything({width: 10}); // returns 1

You can chain a function to create a more strict validation::

    var hasWheels = isAnything.match(function (obj){
        return 'wheels' in obj;
    });

or::

    var hasWheels = occamsrazor.validator().match(function (obj){
        return 'wheels' in obj;
    });

So for example, the score of this new validator will be 2::

    hasWheels({wheels: 4}); // returns 2
    hasWheels({feet: 2});   // returns null

You can go on having a more specific validator::

    var hasWheelsAndWings = hasWheels.match(function (obj){
        return 'wings' in obj;
    });

Every validator has a function "score" that returns its specificity::

    isAnything.score()        // 1
    hasWheels.score()         // 2
    hasWheelsAndWings.score() // 3

In order to write validators you can use duck typing, type checking or whatever check you want to use::

    // duck typing
    var has_wings = occamsrazor.validator().match(function (obj){
        return 'wings' in obj;
    });

    //type checking
    var is_a_car = occamsrazor.validator().match(function (obj){
        return Car.prototype.isPrototypeOf(obj);
    });

    //other
    var is_year = occamsrazor.validator().match(function (obj){
        var re = /[0-9]{4}/;
        return !!obj.match(re);
    });

The "match" method allows to define a validator using a terse syntax. You have already seen that it can take a function as argument.
You can also pass a string or a regular expression for matching a string::

    var is_hello = occamsrazor.validator().match('hello');
    var contains_nuts = occamsrazor.validator().match(/nut/);

    is_hello('hello');
    contains_nuts('hazelnut');

Or numbers::

    var is_ten = occamsrazor.validator().match(10);
    is_ten(10);

It works for booleans and null in the same way.
If you pass an array of strings it will match with an object containing all the attributes with those names::

    var has_width_and_height = occamsrazor.validator().match(['width', 'height']);

Finally you can perform deep property checking using an object and combining the previous checks::

    // match with width and height equal to 10
    var has_width_and_height_10 = occamsrazor.validator().match({width: 10, height: 10});

    // match with a center attribute with x and y subattributes
    var has_center = occamsrazor.validator().match({center: ['x', 'y']});

    // match if obj.recipe.ingredients is a string and match with /nuts/
    var recipe_has_nuts = occamsrazor.validator().match({recipe: {ingredients: /nuts/}});

    // match if obj.weight is a number bigger than 100
    var is_heavy = occamsrazor.validator().match({weight: function (obj){return obj > 100}});

.match is so flexible that it is used by default in any place you can pass a validator::

    var shapeMath = occamsrazor()
        .add(['radius'], circleMath)
        .add(['width'], squareMath);

This is perfectly fine for a simple case (all validators have a specificity of 2).
There are other 2 helpers available for checking against the prototype or the constructor function::

    var is_prototype_rect = occamsrazor.validator().isPrototypeOf(rect.prototype);
    var is_instance_rect = occamsrazor.validator().isInstanceOf(Rect);

If you need a custom validator you can extend the object occamsrazor.shortcut_validators::

    occamsrazor.shortcut_validators.isSquare = function (){
        return function (obj){
            return 'width' in obj && 'height' in obj && obj.width === obj.height;
        };
    };

Of course you can combine all the methods we have seen so far::

    // this will have a specificity of 4
    var is_instance_a_square = occamsrazor.validator()
        .isInstanceOf(Rect)
        .match(['width', 'height'])
        .isSquare();

Adding a more specific adapter
==============================
Validators with different scores allow to choose different adapters.
Now add another type of shape, a rectangle::

    var shape4 = {width: 5, height: 6};

A rectangle has both width and height so you will define a more specific validator::

    var has_width_and_height = occamsrazor.validator().match(['width']).match(['height']); // score 3

You have already seen that any time you extend a validator, you get a new one so you could extend the previous one::

    var has_width_and_height = has_width.match(['height']); // score 3

Look out! this is different from defining a validator like this::

    var wrong_has_width_and_height = occamsrazor.validator().match(['width', 'height']); // score 2

The last one has the same specificity of has_width so occamsrazor won't be able to decide what adapter to use!

The score of this validator gets bigger every time is chained with another one::

    var is_parallelepiped = has_width_and_height.match(['depth']);

shape4 is both a rectangle and a square but the has_width_and_height validator is more specific.
Using this validator you can add another adapter::

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

If the arguments (shape4 in the precious example) matches with more than one adapter with the same score, it will throw an exception.

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
In the previous example you saw adapters that adapt a single object. We can also build multiadapters: adapters that adapt more than one object.

Let's make an example. I am writing a drawing application. This application draw different shapes in different context using either canvas, svg or DOM manipulation.
Each of these context has a different API and I am forced to write a different drawing subroutine. To manage the code easily I could use some multiadapters::

    var shapeDraw = occamsrazor.adapters();

    // draw a circle on canvas
    shapeDraw.add(has_radius, is_canvas, function (circle, canvasContext){
        ...
    });

    // draw a square on canvas
    shapeDraw.add(has_width, is_canvas, function (square, canvasContext){
        ...
    });

    // draw a circle on svg
    shapeDraw.add(has_radius, is_svg, function (circle, svgContext){
        ...
    });

    // draw a square on svg
    shapeDraw.add(has_width, is_svg, function (square, svgContext){
        ...
    });

    // draw a circle using DIVs
    shapeDraw.add(has_radius, is_dom, function (circle, domContext){
        ...
    });

    // draw a square using DIVs
    shapeDraw.add(has_width, is_dom, function (square, domContext){
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

You should notice from the previous examples that adapters take as arguments the variables that pass the validation::

    shapeDraw.add(has_radius, is_canvas, function (circle, canvasContext){
    ...
    painter = shapeDraw(shape, context);

In this case a "circle" object and a "canvasContext" object. You can also call the adapter with some extra arguments::

    shapeDraw.add(has_radius, is_canvas, function (circle, canvasContext, strokecolor, fillcolor ){
    ...
    painter = shapeDraw(shape, context, 'red', 'black');

These extra arguments are not considered for the purpose of selecting the adapter.

Adding constructor functions to an adapter
==========================================

Occamsrazor works with constructor functions too ! you just need to wrap the constructor function inside a special wrapper::

    Shape = occamsrazor
        .add(has_width, occamsrazor.wrapConstructor(function (obj){
            this.width = obj.width;
            this.area = this.width * this.width;
        }))
        .add(has_radius, occamsrazor.wrapConstructor(function (obj){
            this.radius = obj.radius;
            this.area = 2 * this.radius * Math.PI;
        }));

    var shape = new Shape({width: 5});

The prototype chain and "constructor" attribute will work as expected.
A little side effect is that the constructor could be called as a function::

    var shape = Shape({width: 5});


Getting all the adapters
========================
Sometimes you need to get back all the matching adapters, not just the more specific::
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
The feature above allows to build a "Mediator" object that implements publish/subscribe.
This is very useful to manage events in a centralized fashion.
Other information about the mediator design pattern are here: http://en.wikipedia.org/wiki/Mediator_pattern.
To make the syntax more intuitive "add" and "all" have the aliases "on" and "trigger"::

    pubsub.on("selected", has_radius, function (evt, circle){
      console.log('Circle is selected and the radius is ', circle.radius);
    });

    pubsub.trigger("selected", {radius: 10});

Of course you can remove the event using ".off" (an alias of remove), you have to pass to it the same function, though::

    pubsub.off("selected", has_radius, func);

If you need to handle the event only once there is a special function ".one"::

    pubsub.one("selected", has_radius, function (evt, circle){
      console.log('This is executed only once');
    });

In the way it works, you'll require to have event attached (with on) before triggering an event. You can also do the opposite. The "stick" method works like trigger but allows to keep the arguments published::

    pubsub.on("selected", has_radius, function (evt, circle){
      console.log('Circle is selected and the radius is ', circle.radius);
    });
    
    pubsub.stick("selected", {radius: 10});
    
    pubsub.on("selected", has_radius, function (evt, circle){
      console.log('This will be fired as well!');
    });

Context
=======
Some methods retain the current context (this). They are: all/trigger, stick, adapt. This allows you to call them as methods or using call/apply.

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

Importing occamsrazor
---------------------
Occamsrazor can be imported in a traditional way::

    <script src="occamsrazor.js"></script>

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

occamsrazor.validator().important
---------------------------------

Syntax::

    a_validator.important([n]);

It bumps the score by n (default to 64).

occamsrazor.validator().match
-----------------------------

Add a check to the validator, it uses a special syntax (used by default by .add, .one).

Syntax::

    // execute a function against the value: returns true or false
    var validator = occamsrazor.validator().match(function);

    // matches if value is equal to string
    var validator = occamsrazor.validator().match(string);

    // matches if value is equal to null
    var validator = occamsrazor.validator().match(null);

    // matches if value is equal to the boolean
    var validator = occamsrazor.validator().match(boolean);

    // matches if value matches with the regular expression
    var validator = occamsrazor.validator().match(regular_expression);

    // matches if these properties are defined in the object
    var validator = occamsrazor.validator().match([array of property names]);

    // deep matching
    var validator = occamsrazor.validator().match({propName1: "string", propName2: {propName3: "string"}});

This last form allows to perform the validation check recursively, walking the properties of the object.
In a property is undefined the value will match any value.

For example::

    var hasCenterX = occamsrazor.validator().match({center: {x: undefined}});
    // will match {center: {x: "10"}}

    var hasCenterX10 = occamsrazor.validator().match({center: {x: "10"}});
    // will match {center: {x: "10"}} but not {center: {x: "11"}}

    var hasCenter5or10 = occamsrazor.validator().match({center: {x : function (c){
      return c === "5" || c === "10";
    }}});
    // will match {center: {x: "5"}} or {center: {x: "10"}}


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
"match" and "isPrototypeOf" are added here but you can add your own if you need.

occamsrazor.adapters
--------------------

returns an adapter registry.

Syntax::

    var adapters = occamsrazor.adapters();

or::

    var adapters = occamsrazor();

Adapters
========
A function/object returned from occamsrazor.adapter

Syntax::

    adapters([arg1, arg2 ...]);

It is equivalent to::

    adapters.adapt([arg1, arg2 ...]);

take 0 or more arguments. It calls the most specific function for the arguments.

adapters.all (alias .trigger)
-------------------------------------------------------

Syntax::

    adapters.all([arg1, arg2 ...]);

take 0 or more arguments. It calls every function that match with the arguments.
The results of the functions are returned inside an array.

adapters.stick 
-------------------------------------------------------

Syntax::

    adapters.stick([arg1, arg2 ...]);

It acts like "all" but persist the arguments and the context (this) in the adapter registry.
Then if anyone use add a new adapter (using add, on or one). It will try to adapt the persisted arguments and fire the result.
In that case the result will be lost, so it is suitable for functions with a side effect (like event handlers).

adapters.add (alias .on)
---------------------------------------------------

Add a function and 0 or more validators to the adapters.
If the adapter takes more than one argument (a multiadapter) you must pass the function as last argument.

Syntax::

    adapters.add(func)

    adapters.add(validator, func)

    adapters.add(validator, validator, validator ..., func)

returns the adapters (this method can be chained). The validator will be converted automatically to a function using occamsrazor.match
If a validator is null it becomes occamsrazor.validator().

adapters.one
---------------------------------------------------
The same as .add but the function will be execute only once and them removed.

adapters.notFound
---------------------------------------------------

Add a default function to the adapters.
This will be called whenever no others adapters fit.

Syntax::

    adapters.notFound(func)

returns the adapters (this method can be chained).

adapters.remove (alias .off)
------------------------------------
delete a function from the adapters. Syntax::

    adapters.remove(func);

returns the adapters (this method can be chained).
If you call it without arguments it will remove all the adapters in the registry.

adapters.size
-------------------------------------------------------

Syntax::

    adapters.size();

returns the number of functions in the adapter.

adapters.merge
-------------------------------------------------------

Syntax::

    adapters1.merge(adapters2, adapters3, ...);

returns an adapter registry that merge all the adapters.

adapters.proxy
-------------------------------------------------------

Syntax::

    var proxy = adapters.proxy();

returns a proxy. This is mostly equivalent to the original adapter registry (you can't call it like a function though, you can use the "adapt" method).
Every adapter added through the proxy get marked and can get removed easily using remove (called on the proxy)::

    adapters.add(...); // this won't be touched
    proxy.add(...); // this will be removed
    proxy.remove(...); // this will be removed

Every method returning an adapter registry, returns a proxy instead.

registry
------------------------------------

Create a registry in the global namespace (window or global).

Syntax::

    occamsrazor.registry('math');

You can use a registry to register an adapter::

    registry('functions');

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
