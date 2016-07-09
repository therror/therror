# therror

therror is a library created for making node error management easy, customizable, interoperable and documentable.

It's written in ES6, for node >= 4 

[![npm version](https://badge.fury.io/js/therror.svg)](http://badge.fury.io/js/therror)
[![Build Status](https://travis-ci.org/therror/therror.svg)](https://travis-ci.org/therror/therror)
[![Coverage Status](https://coveralls.io/repos/therror/therror/badge.svg?branch=master)](https://coveralls.io/r/therror/therror?branch=master)

Therror errors are [javascript errors](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error)
with sugar. You can use this library to create your application or library errors, and maintain fully interoperability with 
others code.

The _sugar_ is: 
 * __variables__: Add runtime information to your error messages
 * __extensibility__: Pure javascript Error classes with easy [ES6 mixins](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#Mix-ins) support
 * __nesting__: Add the parent cause to your library errors
 * __notifications__: Subscribe to events when an error is created: Log them in a single place.
 * __internationalization__: Easy to hook your own i18n library to translate error messages
 * __predefined http errors__: Standard HTTP Error classes for quick programming

With the help of their [peer projects](#peer-projects), you will have the opportunity to create a set of documents in various formats to
satisfy the needs of several teams (operations, delivery, final users, developers, ...) but only maintaining one documentation in
the best place ever: _your source code_. 

[Try therror online](https://tonicdev.com/npm/therror)

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

### Create your own errors
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

### Adding error causes 
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

### Server Error classes
Common use case for your Server Error. Includes Therror.Notificator, Therror.Loggable, Therror.WithMessage and Therror.HTTP mixins

```js
let err = new Therror.ServerError.NotFound('The user ${user} does not exists', {user: 'Sarah'});

res.statusCode(err.statusCode) // 404
res.json(err.toPayload())
// {
//    error: 'NotFound',
//    message: 'The user Sarah does not exists'
// }
```

`toPayload()` method is meant to get the final response to the client. 
When the error `statusCode >= 500`, it will set in the payload response
a generic response to hide the implementation details to the user, while
having the original properties untouched to log the error as it was defined

```js
let err = new Therror.ServerError.ServiceUnavailable('BD Misconfigured');

console.log(err); // [ServiceUnavailable: BD Misconfigured]

// Send a hidden response to the client (Express example)
res.statusCode(err.statusCode) // 503
res.json(err.toPayload())
// {
//    error: 'InternalServerError',
//    message: 'An internal server error occurred'
// }
```

Create your own
```js
class UserNotFound extends Therror.ServerError({
  message: 'User ${username} does not exists',
  level: 'info',
  statusCode: 404
}){}

let error =  new UserNotFound({username: 'John Doe'});
```


The following classes have been defined in `Therror.ServerError`
```js
{
     '400': 'BadRequest',
     '401': 'Unauthorized',
     '402': 'PaymentRequired',
     '403': 'Forbidden',
     '404': 'NotFound',
     '405': 'MethodNotAllowed',
     '406': 'NotAcceptable',
     '407': 'ProxyAuthentication Required',
     '408': 'RequestTimeout',
     '409': 'Conflict',
     '410': 'Gone',
     '411': 'LengthRequired',
     '412': 'PreconditionFailed',
     '413': 'RequestEntityTooLarge',
     '414': 'RequestUriTooLarge',
     '415': 'UnsupportedMediaType',
     '416': 'RequestedRangeNotSatisfiable',
     '417': 'ExpectationFailed',
     '418': 'ImATeapot',
     '422': 'UnprocessableEntity',
     '423': 'Locked',
     '424': 'FailedDependency',
     '425': 'UnorderedCollection',
     '426': 'UpgradeRequired',
     '428': 'PreconditionRequired',
     '429': 'TooManyRequests',
     '431': 'RequestHeaderFieldsTooLarge',
     '451': 'UnavailableForLegalReasons',
     '500': 'InternalServerError',
     '501': 'NotImplemented',
     '502': 'BadGateway',
     '503': 'ServiceUnavailable',
     '504': 'GatewayTimeout',
     '505': 'HTTPVersionNotSupported',
     '506': 'VariantAlsoNegotiates',
     '507': 'InsufficientStorage',
     '509': 'BandwidthLimitExceeded',
     '510': 'NotExtended',
     '511': 'NetworkAuthenticationRequired' 
}
```

### Internationalization
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

### Bluebird ready
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

### Add functionality to your errors by [using mixins](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#Mix-ins)

#### Shared messages across all instances
DRY. Rehuse the errors customizing only metadata
```js
const Therror = require('therror');

class NotFoundError extends Therror.WithMessage('The user ${user} does not exists') {}

let error = new UserNotFoundError({user: 'John'});

// { [UserNotFoundError: The user John does not exists] }

let error2 = new UserNotFoundError(error, {user: 'Sarah'});

// { [UserNotFoundError: The user Sarah does not exists] }
```

#### Custom HTTP Errors
Be expressive with your Server errors
```js
const Therror = require('therror');

class UserNotFound extends Therror.HTTP('404') {}

let err = new UserNotFound('The user ${user} does not exists', {user: 'Sarah'});

// Send the response (Express example)
res.statusCode(err.statusCode) // 404
res.json(err.toPayload())
// {
//    error: 'UserNotFound',
//    message: 'The user Sarah does not exists'
// }

class DatabaseError extends Therror.HTTP('503') {}

let err = new DatabaseError(cause, 'BD Misconfigured');

console.log(err); // [DatabaseError: BD Misconfigured]

// Send a hidden response to the client (Express example)
res.statusCode(err.statusCode) // 503
res.json(err.toPayload())
// {
//    error: 'InternalServerError',
//    message: 'An internal server error occurred'
// }
```

#### Serializing your errors
For easy logging and server returning using [serr](https://github.com/therror/serr).  
```js
const Therror = require('therror');

// Builtin mixin in therror
class FatalError extends Therror.Serializable() {}

let cause = new Error('ENOENT');
let error = new FatalError(cause, 'Something went wrong');

console.log('%s', error);
// FatalError: Something went wrong
//    at repl:1:35
//    ...
// Caused by: Error: ENOENT
//    at repl:1:50
//    ...
console.log('%j', error);
// {"message":"Something went wrong","name":"FatalError","constructor":"FatalError","causes":[{"message":"ENOENT","name":"Error","constructor":"Error"}]}
```
You can also use [logops](https://github.com/telefonicaid/logops), an error friendly logger that incorporates support off the shell for this functionality.

#### Notifications
Never miss again a log trace when creating Errors
```js
const Therror = require('therror');

// Subscribe to error creations and log them
Therror.on('create', console.error);

class FatalError extends Therror.Notificator() {}

let fatal = new FatalError('This is immediately logged');
// [Error: This is immediately logged]
// console.log(fatal) Not miss anymore a trace cause you forgot to log it
```

#### Logging levels
Cause not all errors have the same severity. Preconfigure them with it
```js
const Therror = require('therror');

// Set your favourite logger (defaults to console)
Therror.Loggable.logger = require('logops');

class NotFoundError extends Therror.Loggable('info') {}

let notFound = new NotFoundError('User Not found');

notFound.log();
// calls logger.info(notFound)
// INFO  NotFoundError: User Not Found

notFound.level();
// info
```
 
#### Namespacing your errors
For easy identification in logs and tests using `err.name` 
```js
const Therror = require('therror');

// Builtin mixin in therror
class InvalidParamError extends Therror.Namespaced('Server') {}
let err = new InvalidParamError('Not a valid parameter');

console.log(err);
// [Server.InvalidParamError: Not a valid parameter]
```

### Change the template library  
Therror ships [lodash template](https://lodash.com/docs#template) system to allow you adding runtime variables to the final error message.

More info: `Therror.parse()`

## Peer Projects
* [therror-connect](https://github.com/therror/therror-connect): Connect/Express error handler
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
