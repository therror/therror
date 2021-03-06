/**
 * @license
 * Copyright 2014,2015,2016 Telefónica I+D
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const _ = require('lodash'),
  serializeError = require('serr'),
  EventEmitter = require('events').EventEmitter;

const templateSymbol = Symbol('template');
const causeSymbol = Symbol('cause');
const emitter = new EventEmitter();

/**
 * Therror class
 *
 * Extends
 *
 * @constructor
 */
class Therror extends Error {
  constructor() {
    super();

    let args = getArguments(arguments);

    Error.captureStackTrace(this, this.constructor);

    let name = this.constructor.name;
    Object.defineProperty(this, 'name', {
      enumerable: false,
      writable: true,
      value: name === 'Therror' ? 'Error' : name
    });

    Object.defineProperty(this, 'isTherror', {
      enumerable: false,
      value: true
    });

    args.properties.forEach((property, index) => {
      if (_.isString(property)) {
        this[index] = property;
      } else {
        Object.assign(this, property);
      }
    });

    this[causeSymbol] = args.cause;
    this[templateSymbol] = _.template(
      args.message || (args.cause && args.cause.message) || 'Unknown error'
    );
  }

  cause() {
    return this[causeSymbol];
  }

  parse(tpl) {
    return _.template(tpl)(this).trim();
  }

  set message(value) {
    this[templateSymbol] = _.template(value);
  }

  get message() {
    return this[templateSymbol](this).trim();
  }

  //////

  static on(ev, cb) {
    return emitter.on(ev, cb);
  }

  static emit(name, payload) {
    return emitter.emit(name, payload);
  }

  //////////

  /**
   * Class to extend a Therror to prefix the error name with the one provided
   * allowing an categorization of errors to identify them
   *
   * @example
   * ```js
   * class FatalError extends Therror.Namespaced('Server') {}
   *
   * let error = new FatalError('Something went wrong');
   *
   * console.log(error.namespace) // Server
   * console.log(error.name) // Server.FatalError
   * ```
   *
   * @param {String} name the namespace name
   * @param {class} [Base] The Base class to extend
   * @returns {class}
   * @constructor
   */
  static Namespaced(name, Base) {
    let BaseClass = Base || Therror;
    return class extends BaseClass {
      constructor(err, msg, prop) {
        super(err, msg, prop);
        if (this.name) {
          this.name = `${name}.${this.name}`;
        } else {
          this.name = name;
        }
      }

      get namespace() {
        return name;
      }
    };
  }

  /**
   * Mixin to add `toJSON` and an enhanced `toString` methods to errors
   * It will use `serr` node module to serialize it,
   * and will print the stack traces when converting to String and will omit
   * them when converting to json
   *
   * @example
   * ```js
   *
   * class FatalError extends Therror.Serializable() {}
   *
   * let error = new FatalError('Something went wrong');
   *
   * console.log('%s', error);
   * // FatalError: Something went wrong
   * //    at repl:1:35
   * //    at REPLServer.defaultEval (repl.js:248:27) ...
   * console.log('%j', error);
   * // {"message":"Something went wrong","name":"FatalError","constructor":"FatalError"}
   * ```
   *
   * @param {class} [Base] The Base class to extend
   * @returns {class}
   * @constructor
   */
  static Serializable(Base) {
    let BaseClass = Base || Therror;
    return class extends BaseClass {
      toString() {
        return serializeError(this).toString(true);
      }

      toJSON() {
        return serializeError(this).toObject();
      }
    };
  }

  /**
   * Mixin to add notification capabilities to a Therror
   * The Error created with this mixin will emit a `create` event in Therror
   * it has been instantiated
   *
   * If you are using several mixins, these should be the first one in the chain
   *
   * @example
   * ```js
   *
   * Therror.on('create', console.error)
   *
   * class FatalError extends Therror.Notificator() {}
   *
   * let error = new FatalError('Something went wrong');
   *
   * // { [FatalError: Something went wrong] }
   * ```
   *
   * @param {class} [Base] The Base class to extend
   * @returns {class}
   * @constructor
   */
  static Notificator(Base) {
    let BaseClass = Base || Therror;
    return class extends BaseClass {
      constructor(err, msg, prop) {
        super(err, msg, prop);
        Therror.emit('create', this);
      }
    };
  }

  /**
   * Mixin to add preconfigured logging settings to a Therror
   * Adds a `log` method to the instance that will call the method specified
   * by the `level` parameter on the preconfigured logger with the instance
   * as the parameter
   *
   * You can specify the logger by setting `Therror.Loggable.logger` to your
   * preferred logger (defaults to `console`)
   *
   * @example
   * ```js
   *
   * Therror.Loggable.logger = require('logops');
   *
   * class NotFoundError extends Therror.Loggable('info') {}
   *
   * let error = new NotFoundError('User Not Found');
   *
   * error.log();
   * // INFO  NotFoundError: User Not Found
   * ```
   *
   * @param {String} [level] The logger method to call with the error instance. Defaults to `error`
   * @param {class} [Base] The Base class to extend. Defaults to `Therror`
   * @returns {class}
   * @constructor
   */
  static Loggable(level, Base) {
    level = level || 'error';
    let BaseClass = Base || Therror;
    return class extends BaseClass {
      log(opts) {
        // official support for therror-connect, who calls err.log({req, res})
        // normally, the users may set req.logger as the per-request logger
        if (opts && opts.req && opts.req.logger && opts.req.logger[level]) {
          return opts.req.logger[level](this);
        }
        return Therror.Loggable.logger[level](this);
      }

      level() {
        return level;
      }
    };
  }

  /**
   * Mixin to add preconfigured message to a Therror. It's sugar for your mixins
   * chain to share the same message across all app
   *
   * @example
   * ```js
   *
   * class UserNotFoundError extends Therror.WithMessage('The user ${user} does not exists') {}
   *
   * let error = new UserNotFoundError({user: 'John'});
   *
   * // { [UserNotFoundError: The user John does not exists] }
   *
   * ```
   *
   * @param {String} msg The message template for all error instances
   * @param {class} [Base] The Base class to extend
   * @returns {class}
   * @constructor
   */
  static WithMessage(msg, Base) {
    let BaseClass = Base || Therror;
    return class extends BaseClass {
      constructor() {
        let args = getArguments(arguments);

        args.message = args.message || msg;

        // TODO Support multiple properties
        super(args.cause, args.message, args.properties[0]);
      }
    };
  }

  /**
   * Mixin to create Standard HTTP Errors
   *
   * Exposes a toPayload() method meant to get the final response to the client
   * When the error statusCode is >= 500, it will set in the payload response
   * a generic response to hide the implementation details to the user, while
   * having the original properties untouched to log the error as it was defined
   *
   * @example
   * ```js
   * class UserNotFound extends Therror.HTTP('404') {}
   *
   * let err = new UserNotFound('The user ${user} does not exists', {user: 'Sarah'});
   *
   * res.statusCode(err.statusCode) // 404
   * res.json(err.toPayload())
   * // {
   * //    error: 'UserNotFound',
   * //    message: 'The user Sarah does not exists'
   * // }
   *
   * ```
   *
   * Some convenience shortcut classes are available in Therror.HTTP
   * @example
   * ```js
   * let err = new Therror.HTTP.NotFound('The user ${user} does not exists', {user: 'Sarah'});
   *
   * res.statusCode(err.statusCode) // 404
   * res.json(err.toPayload())
   * // {
   * //    error: 'NotFound',
   * //    message: 'The user Sarah does not exists'
   * // }
   * ```
   *
   * @param {String|Integer} statusCode The error Status Code
   * @param {class} [Base] The Base class to extend. Defaults to Therror
   * @returns {class}
   * @constructor
   */
  static HTTP(statusCode, Base) {
    statusCode = parseInt(statusCode || 500, 10);
    let BaseClass = Base || Therror;
    return class extends BaseClass {
      constructor() {
        let args = getArguments(arguments);

        args.message =
          args.message ||
          (args.cause && args.cause.message) ||
          Therror.HTTP.STATUS_CODES[statusCode] ||
          Therror.HTTP.STATUS_CODES[500];

        // TODO Support multiple properties
        super(args.cause, args.message, args.properties[0]);
      }

      toPayload() {
        return {
          error: this.getPayloadErrorName(),
          message: this.getPayloadMessage()
        };
      }

      getPayloadMessage() {
        return this.statusCode < 500
          ? this.message
          : Therror.HTTP.STATUS_CODES[this.statusCode] ||
              Therror.HTTP.STATUS_CODES[500];
      }

      getPayloadErrorName() {
        return this.statusCode < 500
          ? this.name
          : _.upperFirst(
              _.camelCase(
                Therror.HTTP.STATUS_CODES[this.statusCode] ||
                  Therror.HTTP.STATUS_CODES[500]
              )
            );
      }

      get statusCode() {
        return statusCode;
      }
    };
  }

  /**
   * Mixin with a server common use case
   * Includes Therror.Notificator, Therror.Loggagle, Therror.WithMessage and
   * Therror.HTTP mixins
   *
   * @example
   * ```js
   * class UserNotFound extends Therror.ServerError({
   *    message: 'User ${username} does not exists',
   *    level: 'info',
   *    statusCode: 404
   *  }){}
   *
   * ```
   *
   * @property {Object} [opt] The options
   * @property {String} [opt.level] The Logging level. Defaults to 'error'
   * @property {String} [opt.statusCode] The HTTP Status code. Defaults to 500
   * @property {String} [opt.message] The Error message. Defaults to HTTP default one
   * @param {class} [Base] The Base class to extend
   * @returns {class}
   * @constructor
   */
  static ServerError(opt, Base) {
    opt = opt || {};
    Base = Base || Therror;

    let WithMessage = opt.message
      ? Therror.WithMessage.bind(null, opt.message)
      : Passthru => Passthru; // Passthru mixin, to use Therror.HTTP default message

    return Therror.Notificator(
      // emit events on error creations
      Therror.Loggable(
        opt.level, // make easy logging
        WithMessage(
          // Specify message on classes instead of instances
          Therror.HTTP(
            opt.statusCode, // make this error an HTTP one
            Base
          )
        )
      )
    );
  }
}

// The status codes used to autogenerate classes and messages
Object.defineProperty(Therror.HTTP, 'STATUS_CODES', {
  enumerable: false,
  value: {
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '402': 'Payment Required',
    '403': 'Forbidden',
    '404': 'Not Found',
    '405': 'Method Not Allowed',
    '406': 'Not Acceptable',
    '407': 'Proxy Authentication Required',
    '408': 'Request Timeout',
    '409': 'Conflict',
    '410': 'Gone',
    '411': 'Length Required',
    '412': 'Precondition Failed',
    '413': 'Request Entity Too Large',
    '414': 'Request-URI Too Large',
    '415': 'Unsupported Media Type',
    '416': 'Requested Range Not Satisfiable',
    '417': 'Expectation Failed',
    // eslint-disable-next-line
    '418': "I'm a teapot",
    '422': 'Unprocessable Entity',
    '423': 'Locked',
    '424': 'Failed Dependency',
    '425': 'Unordered Collection',
    '426': 'Upgrade Required',
    '428': 'Precondition Required',
    '429': 'Too Many Requests',
    '431': 'Request Header Fields Too Large',
    '451': 'Unavailable For Legal Reasons',
    '500': 'Internal Server Error',
    '501': 'Not Implemented',
    '502': 'Bad Gateway',
    '503': 'Service Unavailable',
    '504': 'Gateway Timeout',
    '505': 'HTTP Version Not Supported',
    '506': 'Variant Also Negotiates',
    '507': 'Insufficient Storage',
    '509': 'Bandwidth Limit Exceeded',
    '510': 'Not Extended',
    '511': 'Network Authentication Required'
  }
});

function getArguments(originalArguments) {
  let args, tpl, properties, cause;

  if (
    originalArguments[0] instanceof Error ||
    _.isString(originalArguments[1])
  ) {
    // new Therror(err) || new Therror (*, 'Message')
    cause = originalArguments[0];
    args = Array.prototype.slice.call(originalArguments, 1);
  } else {
    args = Array.prototype.slice.call(originalArguments, 0);
  }

  if (_.isString(args[0]) || _.isString(args[1])) {
    // new Therror(err, 'Message', {}) || new Therror('Message', {}) ||
    tpl = args[0];
    properties = args.slice(1);
  } else if (_.isObject(args[0])) {
    // new Therror({});
    properties = args.slice(0);
    tpl = args[0].message;
  } else {
    properties = []; // new Therror()
    if (!_.isUndefined(args[0])) {
      tpl = String(args[0]); // new Therror(1);
    }
  }

  return {
    cause: cause,
    message: tpl,
    properties: properties || []
  };
}

// Hack to deal with Node8 BreakingChange about Error class name
function WithName(name, Base) {
  let BaseClass = Base || Therror;
  return class extends BaseClass {
    constructor(err, msg, prop) {
      super(err, msg, prop);
      this.name = name;
    }
  };
}

// Create all the HTTP StatusCode commom Error clases in Therror.ServerError
_.forEach(Therror.HTTP.STATUS_CODES, (value, key) => {
  let name = _.upperFirst(_.camelCase(value));
  let code = parseInt(key, 10);
  let level = code < 500 ? 'info' : 'error';
  // Generation of typings for "namespace ServerErrors". Uncomment and execute node lib/therror.js
  // console.log(`
  //       interface  ${name} extends Classes.ServerError {}
  //       interface  ${name}Constructor extends TherrorConstructor<${name}> {
  //           /** ServerError with statusCode: ${key}, message: '${value}', level: '${level}' */
  //           new(): ${name};
  //       }
  //       export let ${name}: ${name}Constructor;`);
  // Generation of typings for "interface ServerError". Uncomment and execute node lib/therror.js
  // console.log(`
  //      ${name}: typeof ServerErrors.${name};
  //      ${code}: typeof ServerErrors.${name};`);
  Therror.ServerError[name] = Therror.ServerError[code] = WithName(
    name,
    Therror.ServerError({
      statusCode: code,
      level: level
    })
  );
});

// expose a configurable logger
Therror.Loggable.logger = console;

module.exports = Therror;
// ES6 Module export compatibility
module.exports.default = Therror;
