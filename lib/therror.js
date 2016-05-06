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

const isString = require('lodash.isstring'),
      template = require('lodash.template'),
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

    let args, tpl = '', properties = {};

    if (arguments[0] instanceof Error) {
      // new Therror(err)
      this[causeSymbol] = arguments[0];
      args = Array.prototype.slice.call(arguments, 1);
    } else {
      args = Array.prototype.slice.call(arguments, 0);
    }

    if (isString(args[0])) {
      // new Therror(err, 'Message', {}) || new Therror('Message', {});
      tpl = args[0];
      properties = args.slice(1);
    } else {
      // new Therror({});
      properties = args.slice(0) || {};
      tpl = (args[0] || {}).message || '';
    }

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

    properties.forEach((property, index) => {
      if (isString(property)) {
        this[index] = property;
      } else {
        Object.assign(this, property);
      }
    });

    this[templateSymbol] = template(tpl);
  }

  cause() {
    return this[causeSymbol];
  }

  parse(tpl) {
    return template(tpl)(this).trim();
  }

  set message(value) {
    this[templateSymbol] = template(value);
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
    let BaseClass =  Base || Therror;
    return class extends BaseClass {
      constructor(err, msg, prop) {
        super(err, msg, prop);
        this.name = `${name}.${this.name}`;
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
    let BaseClass =  Base || Therror;
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
   * // {"message":"Something went wrong","name":"FatalError","constructor":"FatalError"}
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
}

module.exports = Therror;
