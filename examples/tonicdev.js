'use strict';

const Therror = require('../');
const logger = require('logops');
logger.format = logger.formatters.dev;

let simple = new Therror('Simple');
let medium = new Therror('With ${property}', {property: 'things'});
let causes = new Therror(simple, 'With causes');

function ServerErrorMixin(opt) {
  return  Therror.Notificator(
            Therror.Serializable(
              Therror.Namespaced('Server',
                Therror.Loggable(opt.level || 'info',
                  Therror.WithMessage(opt.message
          )))));
}

class ServerError extends ServerErrorMixin({
  message: 'My fancy custom error with ${foo}',
  level: 'info'
}){}

Therror.on('create', logger.error);
Therror.Loggable.logger = logger;

let custom = new ServerError(medium, {foo: 'bar'});
if (custom.isTherror) {
  custom.log();
}

