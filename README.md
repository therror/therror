# therror

therror is a library created for making node error management easy, customizable, interoperable and documentable.

[![npm version](https://badge.fury.io/js/therror.svg)](http://badge.fury.io/js/therror)
[![Build Status](https://travis-ci.org/therror/therror.svg)](https://travis-ci.org/therror/therror)
[![Coverage Status](https://coveralls.io/repos/therror/therror/badge.svg?branch=master)](https://coveralls.io/r/therror/therror?branch=master)

therror errors are [javascript errors](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error)
with sugar. You can use this library to create your application or library errors, and maintain fully interoperability with 
others code.

The _sugar_ is: 
 * __internationalization__: Add a message in the error description, not in the error creation. Re-use and
translate it statically, and then release a rich description in any language to the final user. 
 * __variables__: Add runtime information to your error messages
 * __extensibility__: Add as much custom information or modifications to a single error or to a set of errors as you want
 * __notifications__: Subscribe to events when an error is created: Log them in a single place.

With the help of their [peer projects](#peer-projects), you will have the opportunity to create a set of documents in various formats to
satisfy the needs of several teams (operations, delivery, final users, developers, ...) but only maintaining one documentation in
the best place ever: _your source code_. 

## Installation 
```bash
 npm install --save therror
```

## Examples

You can find a complete example in [therror-example](https://github.com/therror/therror-example) project


### Basic example
```js
var therror = require('therror');

var error = therror.register({
  /*
   * Define your error IDs as literal objects
   * Add as much custom properties as you want. They will be available later
   */
  INVALID_PARAM: {
    /**
     * The error message
     */
    message: 'Parameter {1} not valid.'
    /**
     * The status code to return when this error is raised
     */
    statusCode: 400
  }
});
//...
try {
  throw error.INVALID_PARAM('id');
} catch(err) {
  console.error(err); //INVALID_PARAM: Parameter id not valid.
  res.writeHead(err.statusCode);
}
```

### Advanced features example:
```js
/** filename server-errors.js */
var therror = require('therror');

/**
 * You can define several errors in namespaces, to
 * isolate functionalities
 */
module.exports = therror.register('SERVER', {
  INVALID_PARAM: {
    message: 'Parameter {1} not valid.',
    level: 'info',
    statusCode: 400
  }
}, {
  /**
   * Define methods or properties to every error in that namespace
   */
  toJSON: function toJSON() {
    return {
      //as standard javascript errors, these properties are available and the values for the above error are
      exceptionId: this.name,  //SERVER.INVALID_PARAM
      //Access the error properties defined in your 'init' function
      exceptionMessage: this.httpError + ': ' + this.message, //Bad request: Parameter id not valid
      //you can also access other properties of the error
      exceptionLevel: this.level
    }
  },
  /**
   * This function is called just after error instantiation.
   * Use it to calculate things, just as a constructor
   */
  init: function init() {
    this.httpError = this.level === 400 ?
      'Bad request':
      'Generic error';
  }
});
```

```js
/* filename server.js */
var therror = require('therror');

require('./server-errors');
//can get either the exported module or retrieve errors by namespace. Nice for testing ;)
var errors = therror.namespace('SERVER');

try {
  throw errors.INVALID_PARAM('id');
} catch(err) {
  res.writeHead(err.statusCode);
  res.json(err); //Will use the toJSON method in the err to send the response
  /*
   * {
   *   "exceptionId": "SERVER.INVALID_PARAM",
   *   "exceptionMessage": "Bad request: Parameter id not valid.",
   *   "exceptionLevel": "info"
   * }
   */
}
```

## Variables support
Therror provides a very simple builtin template system to allow you adding
runtime variables to the final error message.

The template method searches in the `message` definition for `{x}`, where `x` is an integer > 0,
and replaces with the corresponding serialized parameter in the error instantiation.

```js
// the ERROR message has been configured to be: 'The {1} value ({2}) is invalid';

var value = 'asereje', param = 'id';
err = ns.ERROR(param, value); //will set err.message === 'The id value (asereje) is invalid'
```

More info: `TherrorBaseError.prototype.getMessage`

## Internationalization
Thanks to the variable support and the message definition is very easy to add i18n support to your error
messages. This library is not coupled with any tool or service, so you may use whatever technology to
translate and then integrate the result at runtime

Therror always will use your preconfigured message in development time, and does not add
any overhead if you don't wanna translation support.

Feel free to add custom i18n functions to your error namespaces or use the following verbose approach

```js
// the ERROR message has been configured to be: 'The {1} value ({2}) is invalid';

try {
  var value = 'asereje', param = 'id';
  throw ns.ERROR(param, value);
} catch (err) {
  console.log(err.message); //'The id value (asereje) is invalid'

  //Search for the message in your i18n service
  var i18nStr = i18n(err.name, currentLang); //El valor ({2}) no es válido para el parámetro {1}

  console.log(err.getMessage(i18nStr)); //El valor (asereje) no es válido para el parámetro id
}
```

You may find the [therror-doc](https://pdihub.hi.inet/javier/therror-doc) project
very useful to automatically isolate your development messages and put in them in files ready
to be translated and used back in your code.

More info: `TherrorBaseError.prototype.getMessage`

## Extensibility

When you register errors with the `therror.register` method, you can give a customization object to
add custom functions for errors in that namespace.

If one of this functions is called `init`, it will be called after the standard error constructor, allowing
you to customize your error instance

More info: _Advanced features example_

## Notifications
Both `therror` and its created namespaces emit the `create` event whenever an event is created.

```js
var therror = require('therror');

require('./server-errors');
//can get either the exported module or retrieve errors by namespace.
var errors = therror.namespace('SERVER');

//Subscribe to every therror error creations, and log them
therror.on('create', function onError(err) {
  console[err.level || 'info'](err.toString()); ////SERVER.INVALID_PARAM: Parameter id not valid.
});

//Subscribe only to 'SERVER' error creations, and log them
errors.on('create', function onError(err) {
  console[err.level || 'info'](err.httpError + '->' + err); ////Bad Request->SERVER.INVALID_PARAM: Parameter id not valid.
});
```

## API

__therror.register__

```js
/**
 * Registers an error namespace in the Therror library
 *
 * @param {[String]} namespaceName Optional namespace Name where the errors will be stored
 * @param {Object} errorDescriptions Literal object with the error name and its properties
 * @param {Object} options Extra functions to be added to every error created in this namespace
 *
 * @throws {THERROR.NAMESPACE_NAME_NEEDED} if you didn't provide valid namespaceName parameter
 * @throws {THERROR.ERROR_DESCRIPTION_NEEDED} if you didn't provide valid errorDescriptions parameter
 *
 * @return {Object}  The Therror namespace with  the error factories
 */
Therror.prototype.register = function register(namespaceName, errorDescriptions, options) { ... }

```

__therror.namespace__

```js
/**
 * Retrieves a previously registered namespace errors
 *
 * @param {String} namespaceName
 * @return {Object} The Therror namespace with  the error factories
 */
Therror.prototype.namespace = function namespace(namespaceName) { ... }
```

Therror and Therror namespaces inherit from [`EventEmmiter`](http://nodejs.org/api/events.html#events_class_events_eventemitter)


## Generated Errors API and properties
Therror will create standard javascript errors that will have two additional methods in their prototype.
You can override them for customizing the default behaviour when registering errors
 in a namespace using the `customization` object (see advanced examples)


### Message generation
```js
/**
 * Creates a parsed message for the error

 * It will replace the '{x}' strings found in the msg with the stringified value
 * of the parameters passed to error instantiation
 *
 * @param {String} msg the base message to analize and introduce parameters
 * @return {String} the message
 */
TherrorBaseError.prototype.getMessage = function getMessage(msg) { ... }

```

### Arguments serialization
```js
var error = errors.SOME_ERROR('someString', new Error('fail'), objWithToJSON);

/**
 * Used internally to get a string representation (serialized) of every parameter
 * passed to the error creation
 * It's called with every parameter passed to the creation of the error, i.e:
 *  'someString', new Error('fail'), objWithToJSON
 * when computing the final message of the error (available on `error.message`)
 *
 * The default implementation in the prototype understands parameters that are:
 *  - strings, returning the string value itself
 *  - undefined, returning the string 'undefined'
 *  - objects with toJSON function, returning the execution of this function
 *  - instances of Error (like Therror objects), returning its message property
 *
 * @param {Object} arg
 * @return {String}
 */
 TherrorBaseError.prototype.stringify = function stringify(arg) { ...}

//Execution examples
error.stringify(new Error('booom')); // 'booom'
error.stringify('someString'); // 'someString'
error.stringify(); // 'undefined'
error.stringify(objWithToJSON); // objWithToJSON.toJSON()
error.stringify(obj); // obj.toString()
```

### Properties

An error `err` created with

```js
 var ns = therror.register('SERVER', {
     INVALID: {
        message: 'Invalid value {1}'
     }
 });

 var err = ns.INVALID('parameter');
```

will have the following properties

```js
{
  message: 'Invalid value parameter', //computed message value on creation time
  name: 'SERVER.INVALID' //The name of the error
  stack: {}, // The stack trace for the error 
  _namespace: 'SERVER', //The namespace this error belongs to
  _type: 'INVALID', //The error type
  _args: [ 'parameter' ], //The passed args to the error instantiation,
  _message: 'Invalid value {1}' //original preconfigured message
}
```

## Peer Projects

* [therror-doc](https://github.com/therror/therror-doc): Documentation parser for therror


## Browser support

Currently browser support is done by [browserifying](http://browserify.org/) this node code (for EventEmmiter support).


## LICENSE

Copyright 2014,2015 [Telefónica I+D](http://www.tid.es)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
