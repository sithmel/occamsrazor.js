Occamsrazor
===========
[![Build Status](https://travis-ci.org/sithmel/occamsrazor.js.svg?branch=master)](https://travis-ci.org/sithmel/occamsrazor.js)

Occamsrazor finds the function (or the functions) that matches a list of arguments. It can be be used to write event systems, or to make an application extensible.

Tutorial
========
Let's say you have some objects:
```js
var shape1 = {radius: 10};
var shape2 = {radius: 5};
var shape3 = {width: 5};
```
Every object represents a different shape. You need to calculate the area of these objects.
```js
var circleArea = function (circle){
  return circle.radius * circle.radius * Math.PI;
};

var squareArea = function (square){
  return square.width * square.width;
};
```
The problem is: how can you pick the right function for each shape ?

This is where occamsrazor enter.
First of all you need some validator. A validator will help to identify a "shape":
```js
var validator = require('occamsrazor-validator');
var has_radius = validator().has('radius');
var has_width  = validator().has('width');
```
A validator is a function that runs over an argument and returns a positive score if the argument matches, or null if it doesn't. You can find further explanations [here](https://github.com/sithmel/occamsrazor-validator).

These two validators match objects with a "radius" or "width" attribute respectively.
Now I create a special function that wraps the two area functions defined previously. I call it "function registry":
```js
var shapeArea = occamsrazor();
```
Then add the two functions to it:
```js
shapeArea.add(has_radius, circleArea);
shapeArea.add(has_width, squareArea);
```
The validators (has_radius and has_width) are used internally to pick the right function.
If you prefer you can chain the "add" methods together:
```js
var shapeArea = occamsrazor()
  .add(has_radius, circleArea)
  .add(has_width, squareArea);
```
From now on if you need to calculate the area you will do:
```js
var area = shapeArea(shape1);
```
Maybe you are thinking, why doing this while you can just extend an object using its prototype or copying attributes and methods.
Well, you just can't change a third party script, for example. You may also want to provide a way to extend your code without changing it.

Working in this way promotes the open/close principle (https://en.wikipedia.org/wiki/Open/closed_principle) because you can add functionalities without changing the original code.

Adding a more specific function
===============================
Validators with different scores allow to choose different functions.
Now I add another type of shape, a rectangle:
```js
var shape4 = {width: 5, height: 6};
```
A rectangle has both width and height so you will define a more specific validator:
```js
var has_width_and_height = validator() // this scores 1
  .has('width')                        // this scores 2
  .has('height');                      // this scores 3
```
Every time you extend a validator, you get a new one so you could instead extend the previous one:
```js
var has_width_and_height = has_width.has('height'); // score 3
```
But pay attention! this is different from defining a validator like this:
```js
var wrong_has_width_and_height = validator().has('width', 'height'); // score 2
```
The last one has the same specificity of has_width so occamsrazor won't be able to decide what function to use!

The score of this validator gets bigger every time is chained with another one:
```js
var is_parallelepiped = has_width_and_height.has('depth');
```
shape4 fits the description of a rectangle and a square (they both has a width) but the has_width_and_height validator is more specific.
Using this validator you can add another function:
```js
var rectangleArea = function (rectangle){
  return rectangle.width * rectangle.height;
};

shapeArea.add(has_width_and_height, rectangleArea);
```
When you call the registry it will execute the most specific function (based on the validator with the highest score):
```js
var area = shapeArea(shape4); // rectangleMath(shape4)
```
If the arguments (shape4 in the previous example) matches with more than one function with the same score, it will throw an exception.

Matching more than one argument
===============================
In the previous example you used a validator to match an argument, in reality you can match any number of arguments.
This one doesn't try to match any argument.
```js
shapeArea.add(function (shape) {
  return 'I can\'t calculate the area';
});
```
This one matches two:
```js
shapeArea.add(has_width, has_width, function (shape1, shape2) {
  // combining the areas of two squares
  return shape1.width * shape1.width + shape2.width * shape2.width;
});
```
You might wonder how the system decide to match a function or another. Well, all the respective scores are put in an array and compared. For example:
```js
[] // this has the lowest score, it doesn't match any argument
[1] > []
[2] > [1]
[1, 1] > [1]
[1, 1] > [1, 0]
[2, 1] > [1, 9, 9, 9]
```
In the "add" method you specify the arguments you want to match but you are not forced to validate all arguments passed to the function.
```js
shapeArea.add(has_width_and_height, function (shape, name) {
  // shape argument is validated (it must have a width and an height)
  // name is not validated
  console.log(name + ' is a rectangle');
});
```

Deleting a function
===================
If you want to delete a function you can use the "remove" method:
```js
shapeArea.remove(rectangleArea);
```
The remove method is chainable:
```js
shapeArea.remove(rectangleArea).remove(squareArea);
```
You can also remove all functions with:
```js
shapeArea.remove();
```
You can also remove all functions matching a set of arguments, using "removeIf".
```js
shapeArea.removeIf(shape4);
```

Adding constructor functions
============================
Occamsrazor works with constructor functions too! you just need to wrap the constructor function inside a special wrapper:

```js
var Shape = occamsrazor
  .add(has_width, occamsrazor.wrapConstructor(function (obj){
      this.width = obj.width;
  }))
  .add(has_radius, occamsrazor.wrapConstructor(function (obj){
      this.radius = obj.radius;
  }));

var shape = new Shape({width: 5});
```
The prototype chain and "constructor" attribute will work as expected.

Shortcut validators
===================
Validators can be expressed in a shorter way as documented [here](https://github.com/sithmel/occamsrazor-validator#validatormatch)
```js
var shapeArea = occamsrazor()
  .add({radius: undefined}, circleArea)
  .add({width: undefined}, squareArea);
```
The shortcuts provide a way to match complex object with a very simple syntax. They have a fixed score:
```js
var registry = occamsrazor()
  .add('select', {center: {x: undefined, y: undefined }},
    function (command, point) {
      // does something with the point
    });

registry('point', {center: {x: 3, y: 2}}); // this matches!
```
That is the equivalent of the less concise:
```js
var validator = require('occamsrazor-validator');
var is_select = validator().match('select');
var is_point = validator().match({center: {x: undefined, y: undefined }});

var registry = occamsrazor()
  .add(is_select, is_point,
    function (command, point) {
      // does something with the point
    });

registry('point', {center: {x: 3, y: 2}}); // this matches!
```


Getting all
===========
So far you have used occamsrazor to get the most specific function (the one with the highest specificity score). You can also get all functions matching the validators, no matter what the score is:
```js
var shapeCalculations = occamsrazor()
  .add(has_width, function (shape) {
    return 'Perimeter is ' + (shape.width * 4);
  })
  .add(has_width, function (shape) {
    return 'Area is ' + (shape.width * shape.width);
  })
  .add(has_radius, function (shape) {
    return 'Perimeter is ' + (2 * Math.PI * shape.radius);
  })
  .add(has_radius, function (shape) {
    return 'Area is ' + (Math.PI * shape.radius * shape.radius);
  });

var results = shapeCalculations.all({width: 10});

// ['Perimeter is 40', 'Area is 100']
```
This will return an array containing all the results.

Using it as a publish/subscribe object
======================================
Using its matching capabilities and the expressiveness of the shortcut syntax, you can use occamsrazor as an event system:
```js
var pubsub = occamsrazor();
pubsub.on('selected', has_radius, function(eventName, shape) {
  // do something with the shape
});
pubsub.trigger('selected', {radius: 10});
```
".on" attaches an event handler and ".trigger" runs all the event handlers matching its arguments.
In reality ".on" is an alias of ".add" and ".trigger" is a slightly modified version of .all (it doesn't return the result of the functions and it defers the execution using setImmediate).
Of course you can remove the event handler using ".off" (an alias of remove).
If you need to handle the event only once there is a special method ".one":
```js
pubsub.one("selected", has_radius, function (evt, circle){
  console.log('This is executed only once');
});
```
Usually you'll need to have an event handler attached (with .on) BEFORE triggering it. Some events represent a state change and it is very convenient keeping them published (imagine something like the "ready" jQuery event for example).
You can publish an event permanently using "stick". This method works like trigger but allows to keep the arguments published, so any new event handler fires immediately:
```js
pubsub.on("selected", has_radius, function (evt, circle){
  console.log('Circle is selected and the radius is ', circle.radius);
});

pubsub.stick("selected", {radius: 10});

pubsub.on("selected", has_radius, function (evt, circle){
  console.log('This will be fired as well!');
});
```

Namespace
=========
If you need to remove functions you added, without affecting others, you can create a new namespace:
```js
var namespace = pubsub.namespace();
namespace.on('selected', has_radius, function () {
  console.log('I have added a function using a namespace');
});

// the following are exactly the same
pubsub.trigger('selected', {radius: 10});
namespace.trigger('selected', {radius: 10});

namespace.remove(); // this removes only the function above
pubsub.remove();    // this removes all functions
```
It works with "removeIf" too.

Context
=======
Some methods retain the current context (this). They are: all/trigger, stick, adapt (that is a version of the object invoked without any method). This allows you to call them as methods or using call/apply.

Registries
==========
This helper function is useful to group functions in registries:
```js
var mathregistry = occamsrazor.registry('math'),
    getArea = mathregistry('area_functions');
```
If a registry doesn't exist it is created and returned by the registry function.
If the function registry required doesn't exist it is created and returned too.
If you don't specify a specific registry you'll get the "default" registry:
```js
var registry = occamsrazor.registry(),
    getArea = registry('area_functions');
```

Syntax and reference
====================

Importing occamsrazor
---------------------
Occamsrazor is a commonjs module
```js
var occamsrazor = require('occamsrazor');
```

Getting a function registry
---------------------------
Syntax:
```js
var funcs = occamsrazor.adapters();
```
or:
```js
var funcs = occamsrazor();
```

Function registry API
=====================
Syntax:
```js
funcs([arg1, arg2 ...]);
```
It is equivalent to:
```js
funcs.adapt([arg1, arg2 ...]);
```

it takes 0 or more arguments. It calls the most specific function with the given arguments and returns its result.
It retains the context (this). If more than one function matches with the same score it throws an exception.

.all
----
```js
funcs.all([arg1, arg2 ...]);
```
it takes 0 or more arguments. It calls all functions that matches, with the given arguments.
It retains the context (this). It returns the results of all functions in an array.

.trigger
--------
```js
funcs.trigger([arg1, arg2 ...]);
```
it takes 0 or more arguments. It calls all functions that matches, with the given arguments.
It retains the context (this). It doesn't return the results as it's execution is deferred (using setImmediate).

.stick
------
```js
funcs.stick([arg1, arg2 ...]);
```
It works the same as trigger, the arguments (including the current context "this") are stored forever. When an new function is added (using "add", "on" or "one"), it is executed immediatly (if it matches).

.add (alias .on)
----------------
Syntax:
```js
funcs.add(func);

funcs.add(validator, func);

funcs.add(validator, validator, validator ..., func);
```
Add a function and 0 or more validators to the function registry. The function is always the last argument.

It returns the function registry, or the namespaced function registry (this method can be chained). The validator will be converted automatically to a function using [validator.match]((https://github.com/sithmel/occamsrazor-validator#validatormatch))

.one
----
The same as .add but the function will be execute only once and them removed.

.remove (alias .off)
--------------------
Syntax:
```js
funcs.remove(func);
```
or
```js
funcs.remove(); // delete all functions
```
Delete one or all functions from the function registry. If it is called on a namespaced function registry, it removes only the functions added with through that namespace.
It returns the function registry, or the namespaced function registry (this method can be chained).

.size
-----
Syntax:
```js
funcs.size();
```
It returns the number of functions in the function registry.

.merge
------
Syntax:
```js
funcs1.merge(funcs2, funcs3, ...);
```
It returns a new function registry merging all functions of itself and the input function registries.
Without arguments is equivalent to clone the function registry.

.namespace (alias .proxy)
-------------------------
Syntax:
```js
var proxy = funcs.namespace([name]);
```
It returns a namespaced function registry. This is mostly equivalent to the original function registry (you can't call it like a function though, you can use the "adapt" method).
Every function added through the this object get marked and can get removed easily using remove:
```js
funcs.add(...); // this won't be touched
namespace.add(...); // this will be removed
namespace.remove(...); // this will be removed
```
The name is optional, a random string is used if not defined. You just have to keep the reference.

registry
========
Syntax:
```js
occamsrazor.registry(name);
```
Create a registry with a specific name (a registry of registries!!!) in the global namespace (window or global).
You can use it to get a function registry.
```js
registry(functionRegistryName);
```
This is created if it doesn't exist.

wrapConstructor
===============
Syntax:
```js
occamsrazor.wrapConstructor(constructorFunction)
```
It transform a constructor function in a simple function that you can call without using "new"

About the name
==============
The name of the library is taken from this philosophical principle:
Occam's Razor:
This principle is often summarized as "other things being equal, a simpler explanation is better than a more complex one."
http://en.wikipedia.org/wiki/Occam%27s_razor

Ok this name can be a little pretentious but I think it can effectively describe a library capable to find the most appropriate answer (function in this case) from a series of assumptions (validators).
