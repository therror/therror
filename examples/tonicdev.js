'use strict';

const Therror = require('../');
const logger = require('logops');
logger.format = logger.formatters.dev;

let simple = new Therror('Simple');
let medium = new Therror('With ${property}', {property: 'things'});
let causes = new Therror(simple, 'With causes');

function ServerErrorMixin() {
  return Therror.Notificator(Therror.Serializable(Therror.Namespaced('Server')));
}

class CustomError extends ServerErrorMixin() {}

Therror.on('create', logger.error);

let custom = new CustomError(medium, 'My fancy custom error with ${foo}', {foo: 'bar'});
