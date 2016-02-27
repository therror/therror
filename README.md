# therror

therror is a library created for making node error management easy, customizable, interoperable and documentable.

[![npm version](https://badge.fury.io/js/therror.svg)](http://badge.fury.io/js/therror)
[![Build Status](https://travis-ci.org/therror/therror.svg)](https://travis-ci.org/therror/therror)
[![Coverage Status](https://coveralls.io/repos/therror/therror/badge.svg?branch=master)](https://coveralls.io/r/therror/therror?branch=master)

Therror errors are [javascript errors](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error)
with sugar. You can use this library to create your application or library errors, and maintain fully interoperability with 
others code.

The _sugar_ is: 
 * __variables__: Add runtime information to your error messages
 * __extensibility__: Pure javascript Error classes with easy ES6 mixins support
 * __nesting__: Add the parent cause to your library errors
 * __categorization__: Super easy way to identify your throws in client code or in logs
 * __notifications__: Subscribe to events when an error is created: Log them in a single place.
 * __internationalization__: Easy to hook your own i18n library to translate error messages

With the help of their [peer projects](#peer-projects), you will have the opportunity to create a set of documents in various formats to
satisfy the needs of several teams (operations, delivery, final users, developers, ...) but only maintaining one documentation in
the best place ever: _your source code_. 

## Installation 
```bash
 npm install --save therror
```

## Usage

```js
const Therror = require('therror');

// Extend Therror to create your own classes 
class InvalidParamError extends Therror {}

try {
  // ES6 Template String syntax to have great i18n support.
  throw new InvalidParamError('${value} is not valid value for ${id}', {value: 12, id: 'offset'});
  // `value` and `id` are now properties of the thrown error.
  // { [InvalidParamError: 12 is not valid value for offset] value: 12, id: 'offset' }
} catch (err) {
  // Add cause to your errors. You can also use Therror directly
   throw new Therror(err, `Invalid param "${err.id}"`));
   // [Error: Invalid param "offset"]
}
```

### Customizing Therror

**Create your own errors**
```js
const Therror = require('therror');

class InvalidParamError extends Therror {
  constructor(props) { 
    super(props);
    // Define the message in the class to not specify it in their instances
    this.message = '${value} is not valid value for ${id}';
    this.statusCode = 400;
  }
}

let err = new InvalidParamError({value: 12, id: 'offset'});
console.log(err);
// { [InvalidParamError: 12 is not valid value for offset] value: 12, id: 'offset', statusCode: 400 }
```

**Add functionality to your errors by [using mixins](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#Mix-ins)**
```js
const Therror = require('therror');

let JSONError = Base => class extends Base {
    toJSON() {
      return {
        name: this.name,
        message: this.message
      };
    }
};

class InvalidParamError extends JSONError(Therror) {}
let err = new InvalidParamError('${value} is not valid value for ${id}', {value: 12, id: 'offset'});

console.log(JSON.stringify(err));
 // {"name":"InvalidParamError","message":"12 is not valid value for offset"}
```

**Namespacing your errors**: For easy identification in logs and tests using `err.name` 
```js
const Therror = require('therror');

// Builtin mixin in therror
class InvalidParamError extends Therror.Namespaced('Server') {}
let err = new InvalidParamError('Not a valid parameter');

console.log(err);
// [Server.InvalidParamError: Not a valid parameter]
```

**Serializing your errors**: For easy logging and server returning using [serr](https://github.com/therror/serr) 
```js
const Therror = require('therror');

// Builtin mixin in therror
class InvalidParamError extends Therror.Serializable() {}
let err = new InvalidParamError('Not a valid parameter');

console.log('%s', err);
// Server.InvalidParamError: Not a valid parameter
//     at repl:1:35
//     at REPLServer.defaultEval (repl.js:248:27) ...

console.log('%j', err);
// {"message":"Not a valid parameter","name":"InvalidParamError","constructor":"InvalidParamError"}
```

**Adding error causes** 
```js
const Therror = require('therror');

try {
  throw new Error('3rd Party error');
} catch(err) {
  let catchedError = new Therror(err, 'There was a problem with 3rd Party');
  console.log(catchedError.cause());
  // [Error: 3rd Party error]
}
```

**Notifications and logging**: Never miss again a log trace when creating Errors
```js
const Therror = require('therror');

// Subscribe to error creations and log them
Therror.on('create', console.error);

let nested = new Therror('This is immediately logged');
// [Error: This is immediately logged]
// console.log(nested) Not miss anymore a trace cause you forgot to log it

// Use an error friendly logger to not miss anything
const logger = require('logops'); // > v1

let error = new Therror(nested, 'Adding causes can save your life in production environments');
logger.error(error);
/*
ERROR Error: Adding causes can save your life in production environments
      Error: Adding causes can save your life in production environments
          at repl:1:35
          ... more stack
          at REPLServer.Interface._ttyWrite (readline.js:833:16)
      Caused by: Error: This is immediately logged
          at repl:1:36
          ... more stack
          at REPLServer.Interface._ttyWrite (readline.js:826:14)
*/
```

**Internationalization**
```js
const Therror = require('therror');

// Will be parsed by `therror-doc` and store the message for you in a JSON, ready for use your own i18n library (WIP)
class InvalidParamError extends Therror {
  constructor(props) { 
    super(props);
    this.message = '${value} is not valid value for ${id}';
  }
}

try {
  throw new InvalidParamError({value: 12, id: 'offset'});
} catch (err) {
  //i18n is your prefered library
  //err.name === InvalidParamError
  err.message = i18n('es-ES', err.name); // return 'El parámetro ${id} no admite como valor ${value}';
  console.log(err);
  // [InvalidParamError: El parámetro offset no admite como valor 12]
}
```

**Bluebird ready**
```js
const Therror = require('therror');
const Promise = require('bluebird');

class InvalidParamError extends Therror {}

Promise.try(() => {
   throw new InvalidParamError('Invalid parameter');
 })
 .catch(InvalidParamError, err => {
   // ...
 });
```

### Change the template library  
Therror ships [lodash template](https://lodash.com/docs#template) system to allow you adding runtime variables to the final error message.

More info: `Therror.parse()`

## Peer Projects
* [therror-doc](https://github.com/therror/therror-doc): Documentation parser for therror (WIP)
* [serr](https://github.com/therror/serr): Error serializer to Objects and Strings

## LICENSE

Copyright 2014,2015,2016 [Telefónica I+D](http://www.tid.es)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
