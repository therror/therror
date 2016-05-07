'use strict';
const Therror = require('therror');
const logger = require('logops');
logger.format = logger.formatters.dev;

class CustomError extends Therror {
  constructor(cause, msg, props) {
    super(cause, msg, props);
    this.customProperty = 'MyCustom'
  }
}

try {
  throw new Therror('User ${username} does not exists', {username: 'John Doe'});
} catch(err) {
  let custom = new CustomError(err, 'Something failed');
  console.log(custom, 'Caused by', custom.cause());
}


// ES6  Mixins support
function ServerError(opt) {
  return  Therror.Notificator( // emit events on error creations
            Therror.Serializable( // add toString/toJSON methods with rich information
              Therror.Namespaced('Server', // classify your errors
                Therror.Loggable(opt.level, // make easy logging
                  Therror.WithMessage(opt.message, // Specify message on classes instead of instances
                    Therror.HTTP(opt.statusCode // make this error an HTTP one
          ))))));
}

class UserNotFound extends ServerError({
  message: 'User ${username} does not exists',
  level: 'info',
  statusCode: 404
}){}


logger.error(new UserNotFound({ username: 'John Doe' });

