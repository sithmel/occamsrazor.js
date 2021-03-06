Occamsrazor
===========
[![Build Status](https://travis-ci.org/sithmel/occamsrazor.js.svg?branch=master)](https://travis-ci.org/sithmel/occamsrazor.js)

Occamsrazor runs the function (or the functions) that matches a list of arguments. It can be be used to write event systems, or to make an application extensible.

Tutorial
========
Let's say you have some objects:
```js
var shape1 = { radius: 10 };
var shape2 = { radius: 5 };
var shape3 = { width: 5 };
```
Every object represents a different shape. You need to calculate the area of these objects.
```js
var circleArea = function (circle) {
  return circle.radius * circle.radius * Math.PI;
};

var squareArea = function (square) {
  return square.width * square.width;
};
```
The problem is: how can you pick the right function for each shape ?

This is where occamsrazor enter.
First of all you need some validator. A validator will help to identify a "shape":
```js
var validator = require('occamsrazor-validator');
var isNUmber = require('occamsrazor-match/extra/isNumber');

var has_radius = validator().match({ radius: isNumber });
var has_width  = validator().match({ width: isNumber });
```
A validator is a function that runs over an argument and returns a positive score if the argument matches, or null if it doesn't. You can find further explanations [here](https://github.com/sithmel/occamsrazor-validator) and [here](https://github.com/sithmel/occamsrazor-match)

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
var shape4 = { width: 5, height: 6 };
```
A rectangle has both width and height so you will define a more specific validator:
```js
var has_width_and_height = validator() // this scores 0
  .match({ width: isNumber })                        // this scores 1
  .match({ height: isNumber });                      // this scores 2
```
Every time you extend a validator, you get a new one so you could instead extend the previous one:
```js
var has_width_and_height = has_width.match({ height: isNumber }); // score 2
```
But pay attention! this is different from defining a validator like this:
```js
var wrong_has_width_and_height = validator().match({ height: isNumber, width: isNumber }); // score 2
```
The last one has the same specificity of has_width so occamsrazor won't be able to decide what function to use!

The score of this validator gets bigger every time is chained with another one:
```js
var is_parallelepiped = has_width_and_height.match({ depth: isNumber }); // score 3
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
The next one doesn't try to match any argument.
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
[0] > []
[1] > [0]
[0, 0] > [1]
[0, 1] > [0, 0]
[1, 0] > [0, 8, 8, 8]
```
In the "add" method you specify the arguments you want to match but you are not forced to validate all arguments passed to the function.
```js
shapeArea.add(has_width_and_height, function (shape, name) {
  // shape argument is validated (it must have a width and an height)
  // name is not validated
  console.log(name + ' is a rectangle');
});
```
The smaller score you can have is 0 (validator()) and it is so generic that matches anything.

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
If you want to remove all functions matching a set of arguments, you can use "removeIf".
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
Validators can be expressed in a shorter way as documented [here](https://github.com/sithmel/occamsrazor-validator#validatormatch) and [here](https://github.com/sithmel/occamsrazor-match)
```js
var isNumber = require('occamsrazor-match/extra/isNumber');

var shapeArea = occamsrazor()
  .add({ radius: isNumber }, circleArea)
  .add({ width: isNumber }, squareArea);
```
The shortcuts provide a way to match complex object with a very simple syntax. They have a fixed score:
```js
var registry = occamsrazor()
  .add('select', { center: { x: isNumber, y: isNumber } },
    function (command, point) {
      // does something with the point
    });

registry('point', { center: { x: 3, y: 2 }}); // this matches!
```
That is the equivalent of the less concise:
```js
var validator = require('occamsrazor-validator');
var is_select = validator().match('select');
var is_point = validator().match({ center: { x: isNumber, y: isNumber }});

var registry = occamsrazor()
  .add(is_select, is_point,
    function (command, point) {
      // does something with the point
    });

registry('point', { center: { x: 3, y: 2 }}); // this matches!
```

Getting all
===========
So far you have used occamsrazor to get the most specific function (the one with the highest score). You can also get all functions matching the validators, no matter what the score is:
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
This will return an array containing all the results. They will be sorted starting with the most specific.

Using it as a publish/subscribe object
======================================
Using its matching capabilities and the expressiveness of the shortcut syntax, you can use occamsrazor as an event system:
```js
var pubsub = occamsrazor();
pubsub.on('selected', has_radius, function(eventName, shape) {
  // do something with the shape
});
pubsub.trigger('selected', { radius: 10 });
```
".on" attaches an event handler and ".trigger" runs all the event handlers matching its arguments.
In reality ".on" is an alias of ".add" and ".trigger" is a slightly modified version of .all (it doesn't return the result of the functions and it defers the execution to the next tick).
Of course you can remove the event handler using ".off" (an alias of remove).
If you need to handle the event only once there is a special method ".one":
```js
pubsub.one("selected", has_radius, function (evt, circle) {
  console.log('This is executed only once');
});
```
Usually you'll need to have an event handler attached (with .on) BEFORE triggering it. Some event represent a state change and it is very convenient keeping them published (imagine something like the "ready" jQuery event for example).
You can publish an event permanently using "post". This method works like trigger but allows to keep the arguments published, so any new event handler fires immediately:
```js
pubsub.on("selected", has_radius, function (evt, circle) {
  console.log('Circle is selected and the radius is ', circle.radius);
});

pubsub.post("selected", { radius: 10 });

pubsub.on("selected", has_radius, function (evt, circle) {
  console.log('This will be fired as well!');
});
```
You can remove these published event using "unpost", passing a validator that will match the arguments:
```js
pubsub.unpost("selected");
```

Consume/consumeOne
==================
This is a variation of the ".on" that is removing arguments published with post when matching.
consumeOne removes only the first argument and then it unregister itself.

A recap
=======
Publish an object:

|         | Returns         | Function executed                         | Objects remains published |
|---------|-----------------|-------------------------------------------|---------------------------|
| adapt   | yes             | the most specific matching the validators |           no              |
| all     | yes (array)     | all matching the validators               |           no              |
| trigger | no, it is async | all matching the validators               |           no              |
| post    | no, it is async | all matching the validators               |           yes             |

* add/on: runs a function every time validators are matching
* one: runs a function the first time validators are matching, then it unregister itself
* consume: runs a function every time validators are matching, and removes the matching object
* consumeOne: runs a function the first time validators are matching, and removes the matching object

Batches
=======
This feature allows to queue many "messages" (calls to trigger/all) and then trigger them all at once.
```js
var events = occamsrazor();

events.on(isNumber, function (n) {
  return n * n;
})

var batch = events.batch();
batch
  .queue(2)
  .queue(3);

var results = batch.all(); // [4, 9])
```
You can queue messages using queue (you can chain that), and use .all (or the alias triggerSync) to call them in synchronously.
You can also use trigger to call them asynchronously:

```js
batch.trigger(function (err, res) {
  // if any function throws an exception, this is captured and
  // res is [4, 9])
});
```
Trigger takes a callback that returns the result (or, in case an error).
Calling trigger/all empties the batch. It can be reused to queue other messages.
Important detail: using the events are triggered either synchronously (all/triggerSync) or asynchronously (trigger) in the same microtask. If any function throws an exception the execution stops.

A classic use case is to collect a sequence of messages and then executing them on request animation frame.

```js
var events = occamsrazor();
var batch = events.batch();

function mainLoop() {
  batch.triggerSync();
  requestAnimationFrame(mainLoop);
}
requestAnimationFrame(mainLoop);

document.addEventListener('keydown', function(event) {
  batch.queue('keydown', event.keyCode);
});

events.on('keydown', 38, function () {
  ... dealing with up arrow ...
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
pubsub.trigger('selected', { radius: 10 });
namespace.trigger('selected', { radius: 10 });

namespace.remove(); // this removes only the function above
pubsub.remove();    // this removes all functions
```
It works with "removeIf" too.

Context
=======
Some methods retain the current context (this). They are: all/trigger, post, adapt (that is a version of the object invoked without any method). This allows you to call them as methods or using call/apply.

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
It can take an option argument containing an "comparator" function (optional). This is used to keep the posted object in a certain order if you need to implement a priority queue. The comparator take an object with this shape:
```js
{
  args: [...], // array of arguments
  context: ... // value of "this"
}
```
The comparator works like the one used by the ".sort" array method. For example:
```js
var adapters = occamsrazor({
  comparator: function (a, b) {
    return a.args[0] - b.args[0]
  }
})
```
This should sort by the first argument (assuming is a number), from the smallest.
The comparator works in a special way when returning 0 (items with same priority): it doesn't proceed on storing the new event. You can use this special behaviour to remove duplicated events in the queue.


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
If no function match, it returns undefined.

.all (alias .triggerSync)
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

.post (alias .stick)
--------------------
```js
funcs.post([arg1, arg2 ...]);
```
It works the same as trigger, the arguments (including the current context "this") are stored forever. When an new function is added (using "add", "on",  "one" or "consume"), it is executed immediatly (if it matches).

.unpost (alias .unstick)
------------------------
```js
funcs.unpost(validator, validator, validator, ...);
```
It takes some validators, just like the .add/.on method (but without the callback).
Every event added with post mathing those arguments is removed.

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
If the last argument is not a function this is converted automatically to a function returning that value.

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

.consume
--------
The same as .add/.on. Functions registered using "consume" will remove every object published with ".post".

.size
-----
Syntax:
```js
funcs.size();
```
It returns the number of functions in the function registry. If you pass arguments to "size" you will get the number of functions matching those arguments.

.consumeOne
-----------
The same as .consume, but it executes the function only once.

.size
-----
Syntax:
```js
funcs.size();
```
It returns the number of functions in the function registry. If you pass arguments to "size" you will get the number of functions matching those arguments.

.namespace (alias .proxy)
-------------------------
Syntax:
```js
var proxy = funcs.namespace([name]);
```
It returns a namespaced function registry. This is equivalent to the original function registry except that every function added through the this object gets marked and can get removed easily using remove:
```js
funcs.add(...); // this won't be touched
namespace.add(...); // this will be removed
namespace.remove(...);
```
The name is optional, a random string is used if not defined. You just have to keep the reference.

.getAdapters
------------
Syntax:
```js
funcs.getAdapters();
```
It exposes the internal registry of all functions. Useful for debugging purposes.
If you pass arguments to this method, these will be used to filter what functions return.


.batch
------
It returns a batch object.
Syntax:
```js
var batch = funcs.batch();
```

batch
=====
This object allows to queue multiple calls.

.queue
------
Queue arguments in the batch.

Syntax:
```js
batch.queue(... args ...);
```
This method returns the batch (it is chainable).
If a comparator is set, the queue respect that order.
It accepts to be bound to a context.
```js
batch.queue.apply(something, [...args...]))
```

.adapt
------
It takes any item on the queue, search the most specific function, and execute that function with the arguments. It returns an array with the results. If a group of arguments doesn't match any function, it returns undefined (for that item).
As usual if a group of arguments matches multiple times with the same score, it throws an exception.
Syntax:
```js
var results = batch.adapt();
```
It empties the queue.

.all/.triggerSync
-----------------
It takes any item on the queue, search the all the functions matching these arguments, and execute those function with the arguments. It returns an array with the results (flattened). If a group of arguments doesn't match any function, it returns undefined (for that item).
Syntax:
```js
var results = batch.all();
```
It empties the queue.

.trigger
--------
It takes any item on the queue, search the all the functions matching these arguments, and execute those function with the arguments.
The functions are executed, in the next tick.
It takes an optional callback, returning the error (or null) and an array with the results (flattened). If a group of arguments doesn't match any function, it returns undefined (for that item).
Syntax:
```js
batch.trigger(function (err, results) {
  ...
});
```
It empties the queue, and returns the adapter object.

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

Asynchronous function queuing
=============================
Asynchronous function queuing is a pattern to allow loading synchronously only a stub, instead of the whole library. The stub registers all method calls in an hidden array. Then the library loads asynchronously and execute all calls queued. This works only for asynchronous (callback based) methods. Occamsrazor includes a couple of useful modules to implement this pattern. The synchronous library contains, for example:
```js
var fakeOccamsrazor = require('occamsrazor/async-func-queue/fake-occamsrazor');
fakeOccamsrazor('_private', 'events');
```
This allows to start using occamsrazor with:
```js
window.events.on( ... );
window.events.trigger( ... );
// etc
```
The library loading the whole occamsrazor will be loaded asynchronously and will contain:
```js
var occamsrazor = require('occamsrazor');
var flushQueue = require('occamsrazor/async-func-queue/flush-queue');

window.events = occamsrazor();
flushQueue('_private', 'events');
```
This will work with all methods returning asynchronously. So these won't work: adapt, all, triggerSync, size, proxy, batch

About the name
==============
The name of the library is taken from this philosophical principle:
Occam's Razor:
This principle is often summarized as "other things being equal, a simpler explanation is better than a more complex one."
http://en.wikipedia.org/wiki/Occam%27s_razor

Ok this name can be a little pretentious but I think it can effectively describe a library capable to find the most appropriate answer (function in this case) from a series of assumptions (validators).
