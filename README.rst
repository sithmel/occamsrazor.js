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
First of all we need some validator. A validator is a function that identify what shape represent an object::

    var is_circle = occamsrazor.validator(function (obj){
        return 'radius' in obj;
    });

    var is_square = occamsrazor.validator(function (obj){
        return 'width' in obj;
    });

In this case we use attribute checking but we could use any kind of check.
A validator returns a positive number if the function returns true or 0 if returns false.
We can easily use validators to perform checks.

    !!is_square(shape1); // false
    !!is_circle(shape1); // true

Now we create a special function that wraps our adapters (we could call it an adapter registry)::

    var shapeMath = occamsrazor.adapters();
    
    shapeMath.add(circleMath, is_circle);
    shapeMath.add(squareMath, is_square);
    
If you prefer you can chain the add methods together and/or use "occamsrazor" instead of "occamsrazor.adapters" (it's just a shortcut)::

    var shapeMath = occamsrazor()
        .add(circleMath, is_circle)
        .add(squareMath, is_square);

For each of the adapters we specify a validator.
From now if we need an adapter for our objects we can do::

    var adapter = shapeMath(shape1);
    adapter.perimeter();

Conceptually an adapter is a function returning an object but, to say the truth, nothing prevent you to write a function that returns a primitive type or nothing at all.

Why use adapters
================
Maybe you are thinking why using an adapter when I can just extend an object using prototype or copying methods.
There are two fundamentals problems with messing directly with the objects::

    1 - the method we choose can conflicts with another with the same name
    2 - it's difficult to test our extension in isolation

Furthermore, using JSON, Javascript developers used to deal with objects without methods and inheritance chains. So using adapters can fit the needings to add behaviours to an object.

Extending an adapter
====================

Now we add another kind of shape, a rectangle::

    var shape4 = {width: 5, height: 6};

All we need to do is to create a new validator::

    var is_rectangle = occamsrazor.validator(is_square, function (obj){
        return 'height' in obj;
    });

occamsrazor.validator allows you to chain a group of validator together.
In this case we extends the "is_square" validator.
A validator returns a value of 0 (if the object doesn't pass the whole chain of validators) or equal to the length of the chain.
As a matter of fact if you execute both is_square and is_rectangle validators on shape4 they returns a positive number::

    is_rectangle(shape4); // 2
    is_square(shape4);    // 1

The highest the number is the more specific is a validator.
Using this validator we can add another adapter::

    var rectangleMath = function (rectangle){
        return {
            area: function (){return rectangle.width*rectangle.height;},
            perimeter: function (){return 2*rectangle.width + 2*rectangle.height;}
        };
    };

    shapeMath.add(rectangleMath, is_rectangle);

When you call the adapter registry it will returns the most specific adapter (based on the validator with the highest score)::

    var adapter = shapeMath(shape4); // rectangleMath(shape4)
    adapter.perimeter();

Deleting an adapter
===================

If you want to delete an adapter you can use the "remove" method.

    shapeMath.remove(rectangleMath);

The remove method is chainable::

    shapeMath.remove(rectangleMath).remove(squareMath);


Multiadapters
=============
In the previous example we saw adapters that adapt a single object. We can also build multiadapters: adapters that adapt more than one object.

Let's make an example. I am writing a simple drawing program. This program can draw different shapes in different context using either canvas, svg or DOM manipulation.
Each of these context has a different API and I am forced to write a different writer subroutine. To manage the code easily I could use some multiadapters::

    var shapeDraw = occamsrazor.adapters();

    // draw a circle on canvas
    shapeDraw.add(function (circle, canvasContext){
        ...
    }, [is_circle, is_canvas])

    // draw a square on canvas
    shapeDraw.add(function (square, canvasContext){
        ...
    }, [is_square, is_canvas])

    // draw a circle on svg 
    shapeDraw.add(function (circle, svgContext){
        ...
    }, [is_circle, is_svg])

    // draw a square on svg 
    shapeDraw.add(function (square, svgContext){
        ...
    }, [is_square, is_svg])

    // draw a circle using DIVs
    shapeDraw.add(function (circle, domContext){
        ...
    }, [is_circle, is_dom])

    // draw a square using DIVs
    shapeDraw.add(function (square, domContext){
        ...
    }, [is_square, is_dom])

From now, if I want to draw something on any context I will use::

    var shape = {radius: 10},
        context = document.getElementByID('#drawing_space');
    
    painter = shapeDraw(shape, context);
    painter.draw();

The adapters machinery will do the rest executing the adapter with the highest score.

The score of multiadapters is calculated sorting the score of the validators in lexicographical order http://en.wikipedia.org/wiki/Lexicographical_order (like a dictionary).

Object registry
===============

It is also possible use occamsrazor.js to build a registry of functions. These functions doesn't adapt anything::

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
    
    var shapeAdder.add(function (canvas){
        return {
            name: 'rectangle',
            add: function (){
                return {width: 5, height: 6};
            }
        }
    },is_canvas );

    var shapeAdder.add(function (canvas){
        return {
            name: 'circle',
            add: function (){
                return {radius: 5};
            }
        }
    },is_canvas );

    var shapeAdder.add(function (canvas){
        return {
            name: 'circle',
            add: function (){
                return {width: 5};
            }
        }
    },is_canvas );

    var canvas_shapes = shapeAdder.all(canvas);

This will return an array containing all the adapters representing the shapes can be painted to a canvas.


Writing Validators
==================
In order to write validators you can use duck typing, type checking or whatever check you want to use::

    // duck typing
    var has_wings = occamsrazor.validator(function (obj){
        return 'wings' in obj;
    });

    //type checking
    var is_a_car = occamsrazor.validator(function (obj){
        return Car.prototype.isPrototypeOf(obj);
    });

    //other
    var is_year = occamsrazor.validator(function (obj){
        var re = /[0-9]{4}/;
        return !!obj.match(re);
    });

Syntax and reference
====================

occamsrazor.validator
---------------------

Validator Factory.

Syntax::

    var validator = occamsrazor.validator([othervalidator, ]func)
    
Arguments:

    - func: a function with an argument (the object to validate). This function returns a boolean
    - othervalidator: (optional) a validator function to chain with the new function

Returns a validator function.
    
Validator function
------------------

The function returned from occamsrazor.validator

Syntax::
    validator(obj)

Arguments:
    obj: any javascript value

Returns 0 or a positive number

obj is passed to the function and othervalidator.
If othervalidator returns a positive number and func returns true the function returns a positive number equals to the validator number plus 1.
If othervalidator returns 0 or func returns false the validator returns 0

occamsrazor.adapter
-------------------

returns an adapter registry.

Syntax::

    var adapters = occamsrazor.adapters();
    
    or
    
    var adapters = occamsrazor();
    
Adapter registry
================
An function/object returned from occamsrazor.adapter

Syntax::
    adapters([arg1, arg2 ...]);

take 0 or more arguments. It calls the most specific function for the arguments.


adapters.add
------------

Add a function and 0 or more validators to the adapter registry. 
If the adapter takes more than one argument (a multiadapter) we must pass an array with all the validators.

Syntax::
    adapters.add(func)

    adapters.add(func, validator)

    adapters.add(func, [an array of validators])

returns the adapter registry (this method can be chained)

adapters.remove
---------------
delete a function from the adapter registry. Syntax::

    adapters.remove(func);

returns the adapter registry (this method can be chained)

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


