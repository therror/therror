/**
 * @license
 * Copyright 2014,2015 Telefónica I+D
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

var util = require('util'),
    EventEmitter = require('events').EventEmitter;
/**
 * Shortcut for internal type checking
 * @type {Function}
 */
var toString = Object.prototype.toString;

/**
 * Therror Object.
 * Once instantiated, it's returned as the result of the module
 *
 * @constructor
 */
function Therror() {
  EventEmitter.call(this);
  this._namespaces = {};
}

util.inherits(Therror, EventEmitter);

/**
 * The gobal namespace name
 * @type {String}
 */
Therror.__GLOBAL_NS_NAME = '__GLOBAL';

/**
 * This is the Base error, the core of Therror
 *
 * @param {Object} options
 * @constructor
 */
function TherrorBaseError(options) {
  Error.call(this);
  Error.captureStackTrace(this, TherrorBaseError);

  options = options || {};
  options.errorData = options.errorData || {};

  Object.keys(options.errorData).forEach(function(id) {
    this[id] = options.errorData[id];
  }.bind(this));

  this._namespace = options.namespaceName || Therror.__GLOBAL_NS_NAME;
  // this.type is used internally by node
  this._type = options.errorName || 'GENERIC';
  this._args = options.templateArgs || [];
  this._message = this.message;

  // message and name are conventions on node Errors to
  // make the default toString
  this.message = this.getMessage(this.message);
  this.name = this._namespace !== Therror.__GLOBAL_NS_NAME ?
      this._namespace + '.' + this._type :
      this._type;
}

util.inherits(TherrorBaseError, Error);

/**
 * Used internally to get a string representation (serialized) of every parameter
 * passed to the error creation
 * It's called with every parameter passed to the creation of the error, i.e:
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
TherrorBaseError.prototype.stringify = function stringify(arg) {
  if (toString.call(arg) === '[object String]') {
    return arg;
  } else if (typeof arg === 'undefined') {
    return 'undefined';
  } else if (arg instanceof Error) {
    return arg.message;
  } else if (typeof arg.toJSON === 'undefined') {
    return arg.toString();
  } else {
    return JSON.stringify(arg);
  }
};

/**
 * Creates a parsed message for the error

 * It will replace the '{x}' strings found in the msg with the stringified value
 * of the parameters passed to error instantiation
 *
 * @param {String} msg the base message to analize and introduce parameters
 * @return {String} the message
 */
TherrorBaseError.prototype.getMessage = function getMessage(msg) {
  if (!msg) {
    if (this._args.length) {
      return this._args.map(function(arg) {
        return this.stringify(arg);
      }, this).join(' ');
    }
    return '';
  }
  //Clone the arguments
  var args = this._args.slice(0);

  msg = msg.replace(/\{\d+\}/g, function(match) {
    var index = +match.slice(1, -1),
        ret = match,
        target = this._args[index - 1];

    if (args.length) {
      ret = this.stringify(target);
      args.splice(args.indexOf(target), 1);
    }
    return ret;
  }.bind(this)) + ' ';

  msg += args.map(function(arg) {
    return this.stringify(arg);
  }, this).join(' ');

  return msg.trim();
};

/**
 * The therror namespace is where we store errors.
 * It's only properties are those inherited from the EventEmitter, to
 * allow subscription on this namespace errors creations
 * @constructor
 */
var TherrorNamespace = function() {
  EventEmitter.call(this);
};

util.inherits(TherrorNamespace, EventEmitter);

/**
 * Factory method to create errors
 *
 * @param {Object} args
 * @param {Object} options
 * @param {Object} therror
 * @return {function(this:Therror)}
 */
TherrorNamespace.prototype._errorConstructorFactory = function _errorConstructorFactory(
    args, options, therror) {
  return function errorConstructor() {
    var error = new TherrorBaseError({
          namespaceName: args.namespaceName,
          errorName: args.errorName,
          errorData: args.errorData,
          templateArgs: Array.prototype.slice.call(arguments, 0)
        }
    );

    if (options && toString.call(options) === '[object Object]') {
      Object.keys(options).forEach(function(property) {
        error[property] = options[property];
      });
    }

    if (toString.call(error.init) === '[object Function]') {
      error.init.call(error);
    }
    //emit event on therror
    this.emit('create', error);
    therror.emit('create', error);
    return error;
  }.bind(this);
};

/**
 * Registers an error namespace in the Therror library
 *
 * @param {[String]} namespaceName Optional namespace Name where the errors will be stored
 * @param {Object} errorDescriptions Literal object with the error name and its properties
 * @param {Object} options Extra functions to be added to every error created in this namespace
 *
 * @throws {THERROR.NAMESPACE_NAME_NEEDED} if you didn't provide namespaceName parameter
 * @throws {THERROR.ERROR_DESCRIPTION_NEEDED} if you didn't provide errorDescriptions parameter
 *
 * @return {Object}  The Therror namespace with  the error factories
 */
Therror.prototype.register = function register(namespaceName, errorDescriptions, options) {
  var ns, errDesc, opt;
  if (toString.call(namespaceName) === '[object Object]') {
    ns = Therror.__GLOBAL_NS_NAME;
    errDesc = namespaceName;
    opt = errorDescriptions;
  } else if (!namespaceName || toString.call(namespaceName) !== '[object String]') {
    throw require('./errors').NAMESPACE_NAME_NEEDED(toString.call(namespaceName));
  } else if (!errorDescriptions || toString.call(errorDescriptions) !== '[object Object]') {
    throw require('./errors').ERROR_DESCRIPTION_NEEDED();
  } else {
    ns = namespaceName;
    errDesc = errorDescriptions;
    opt = options;
  }

  var where = this._namespaces[ns] || (this._namespaces[ns] = new TherrorNamespace()),
      therror = this;

  Object.keys(errDesc).forEach(function(errorName) {
    where[errorName] = where._errorConstructorFactory({
      namespaceName: ns,
      errorName: errorName,
      errorData: errDesc[errorName]
    }, opt, therror);
  }, where);

  return where;
};

/**
 * Retrieves a previously registered namespace errors
 *
 * @param {String} namespaceName
 * @return {Object}  The Therror namespace with  the error factories
 */
Therror.prototype.namespace = function namespace(namespaceName) {
  return this._namespaces[namespaceName || Therror.__GLOBAL_NS_NAME];
};

//The therror instance to be used and returned
var therror = new Therror();
/**
 * This object provides a utility for producing rich Error messages.
 */
module.exports = therror;

/**
 * The Base Error
 * @type {Function}
 */
module.exports.Error = TherrorBaseError;
