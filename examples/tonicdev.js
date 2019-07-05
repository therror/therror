'use strict';
const Therror = require('therror');

class CustomError extends Therror {
  constructor(cause, msg, props) {
    super(cause, msg, props);
    this.DB = 'Users';
  }
}

class UserNotFound extends Therror.ServerError({
  message: 'User ${username} does not exists',
  level: 'info',
  statusCode: 404
}) {}

let simpleError = new Therror('With Runtime Properties', {
  criteria: 'John Doe'
});
console.log(simpleError.criteria); // "John Doe"

let customError = new CustomError(simpleError, 'With Causes');
console.log(customError.cause()); // { [Error: With Runtime Properties] criteria: 'John Doe' }
console.log(customError.DB); // Users

let mixinError = new UserNotFound({ username: 'John Doe' });
console.log(mixinError.toPayload()); // { error: 'UserNotFound', message: 'User John Doe does not exists' }
console.log(mixinError.statusCode); // 404
console.log(mixinError.level()); // info
mixinError.log(); // { [UserNotFound: User John Doe does not exists] username: 'John Doe' }
