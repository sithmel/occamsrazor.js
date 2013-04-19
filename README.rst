occamsrazor.js 2.2.1
====================
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
First of all we need some validator. A validator is a function that helps to identify what shape represent an object::

    var has_radius = function (obj){
        return 'radius' in obj;
    };

    var has_width = function (obj){
        return 'width' in obj;
    };

I can use this validators to determine the kind of an object.
A shape has a radius ? It's a circle !
A shape has a width  ? It's a square !
That's it !

In this case we use attribute checking but we could use any kind of check.
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

From now if we need an adapter for our objects we can do::

    var adapter = shapeMath(shape1);
    adapter.perimeter();

Conceptually an adapter is a function returning an object but, to say the truth, nothing prevent you to write a function that returns a primitive type or nothing at all.

Why use adapters
================
Maybe you are thinking why using an adapter when I can just extend an object using prototype or copying attributes and methods.
There are two fundamentals problems with messing directly with the objects:

- the method name we choose can conflicts with another one. Generally speaking patches can easily become incompatible between each others
- it's difficult to test an extension in isolation

Furthermore, using JSON, Javascript developers often deal with objects without methods and inheritance chains. So using adapters can fit the needings to add behaviours to an object.

Adding a more specific adapter
==============================

Now we add another kind of shape, a rectangle::

    var shape4 = {width: 5, height: 6};

We could write another validator::

    var has_width_and_height = function (obj){
        return  'width' in obj && 'height' in obj;
    };

But this won't work correctly because both has_width and has_width_and_height return true and it's impossible to choose between them.
We can solve this problem introducing a property of the validators: the specificity score.
A validator can return a positive number to indicate how much is specific.
We can use the utility function "chain" to chain together a group of validators. In this case we extends the "has_width" validator::

    var has_width_and_height = occamsrazor.chain(has_width, function (obj){
        return 'height' in obj;
    });

The score of this validator is the sum of the scores of every single validator (in this case 2).
For the sake of clarity we should write a "has_width_height_depth" validator like this::

    var is_parallelepiped = occamsrazor.chain(is_rectangle, function (obj){
        return 'depth' in obj;
    });

This validator can return 3 (validate) or 0 (not validate).
The general rule is: a validator must return a positive number if the validation is positive or a Javascript falsy value if the validation is negative.
because of this, we can easily use validators to perform checks::

    !!has_width(shape1); // false
    !!has_radius(shape1); // true

As a matter of fact if you execute both has_width and has_width_and_height validators on shape4 they returns a positive number::

    has_width_and_height(shape4); // 2
    has_width(shape4);    // 1

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


Object registry
===============

You can use occamsrazor.js to build a registry of functions. These functions doesn't adapt anything::

    var mail_adapters = occamsrazor.adapters();

    mail_adapter.add(function (){
        return {send : function (msg){
            ... // send a mail
        }};
    });
    
    var mail_sender = mail_adapters();

    mail_sender.send('Hello !')

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

    var is_selected_event = function (evt){
        return evt === 'selected';
    };

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

To make everything simpler we can use a special feature (explained in the section "Quick validators"). If a validator must perform a simple string checking we can use the string instead of the validator function::

    pubsub.subscribe(["selected",has_radius],
        function (evt, circle){
            console.log('Circle is selected');
        }
    );


Writing Validators
==================
In order to write validators you can use duck typing, type checking or whatever check you want to use::

    // duck typing
    var has_wings = function (obj){
        return 'wings' in obj;
    };

    //type checking
    var is_a_car = function (obj){
        return Car.prototype.isPrototypeOf(obj);
    };

    //other
    var is_year = function (obj){
        var re = /[0-9]{4}/;
        return !!obj.match(re);
    };

Quick validators
================
Quick validators are functions that helps to write the most common validators.
occamsrazor.stringvalidator is used to validate strings::

    var is_hello = occamsrazor.stringValidator('hello');
    
Validate a string equal to "hello". It uses the toString method to convert an object to its string representation.
It can be used even with regular expressions::
 
    var contains_nuts = occamsrazor.stringValidator(/nut/);

If we pass a string or a regular expression instead of a validator function this string is automatically converted to a stringvalidator.
Working with occamsrazor.js is often practical define your own "quickvalidator" functions.
For example::

    occamsrazor.attributeValidator = function (attributeName){
        var closure = function (obj){
            return attributeName in obj;
        };
        return closure;
    };

and then::

    var has_name = occamsrazor.attributeValidator('name');


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

    validator(obj);

Arguments:
    obj: any javascript value

A function that takes an argument and returns a Javascript falsy value or a positive number. 
A falsy value means that the argument passed is not valid. A positive number represent that
the argument passed is valid. The number is equal to the number of checks performed by the validator.

occamsrazor.chain
-----------------

Chain validators together.

Syntax::

    var validator = occamsrazor.chain(validator1, validator2 ...);
    
Arguments:

- 2 or more validators

Returns a validator function.
    

occamsrazor.adapters
--------------------

returns an adapter registry.

Syntax::

    var adapters = occamsrazor.adapters();
    
or::
    
    var adapters = occamsrazor();
    
Adapter registry
================
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

Add a function and 0 or more validators to the adapter registry. 
If the adapter takes more than one argument (a multiadapter) we must pass an array with all the validators.

Syntax::

    adapters.add(func)

    adapters.add(validator, func)

    adapters.add([an array of validators], func)

returns the adapter registry (this method can be chained). If the validator is a string or a regular expression is converted automatically to a function using occamsrazor.stringValidator
If a validator is null it become occamsrazor.isAnything.

adapters.addNew (alias .addConstructor)
---------------------------------------------------

Add a constructor function and 0 or more validators to the adapter registry. 
If the adapter takes more than one argument (a multiadapter) we must pass an array with all the validators.

Syntax::

    adapters.addnew(func)

    adapters.addnew(validator, func)

    adapters.addnew([an array of validators], func)

returns the adapter registry (this method can be chained). If the validator is a string or a regular expression is converted automatically to a function using occamsrazor.stringValidator
If a validator is null it is converted as occamsrazor.isAnything.

adapters.remove (alias .off)
------------------------------------
delete a function from the adapter registry. Syntax::

    adapters.remove(func);

returns the adapter registry (this method can be chained)

occamsrazor.stringValidator
---------------------------

Returns a validator function that returns true if the string is equal or the regular expression matches.

Syntax::

    var validator = occamsrazor.stringValidator(string);

    var validator = occamsrazor.stringValidator(regular_expression);

occamsrazor.isAnything
----------------------
It is a validator function returning True::

    occamsrazor.isAnything = function (obj){
        return true;
    };

It has the least possible specificity (1).

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
I wrote about what I didn'like of Zope component architecture here (http://sithmel.blogspot.it/2012/05/occamsrazorjs-javascript-component.html)
