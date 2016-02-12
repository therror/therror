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
      EventEmitter = require('events').EventEmitter;

const templateSymbol = Symbol('template');
const causeSymbol = Symbol('cause');
const emitter = new EventEmitter();

class Therror extends Error {
  constructor() {
    super();

    let cause, args, template = '', properties = {};

    if (arguments[0] instanceof Error) {
      // new Therror(err)
      this[causeSymbol] = arguments[0];
      args = Array.prototype.slice.call(arguments, 1);
    } else {
      cause = null;
      args = Array.prototype.slice.call(arguments, 0);
    }

    if (isString(args[0])) {
      // new Therror(err, 'Message', {}) || new Therror('Message', {});
      template = args[0];
      properties = args.slice(1);
    } else {
      // new Therror({});
      properties = args.slice(0) || {};
      template = (args[0] || {}).message || '';
    }

    Error.captureStackTrace(this, this.constructor);

    let name = this.constructor.name;
    Object.defineProperty(this, 'name', {
      enumerable: false,
      writable: true,
      value: name === 'Therror' ? 'Error' : name
    });

    properties.forEach((property, index) => {
      if (isString(property)) {
        this[index] = property;
      } else {
        Object.assign(this, property);
      }
    });

    this[templateSymbol] = template;

    emitter.emit('create', this);
  }

  cause() {
    return this[causeSymbol];
  }

  parse(tpl) {
    return template(tpl)(this).trim();
  }

  set message(value) {
    this[templateSymbol] = value;
  }

  get message() {
    return this.parse(this[templateSymbol]);
  }

  //////

  static on(ev, cb) {
    return emitter.on(ev, cb);
  }

  //////////

  static Namespace(name, Base) {
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
}

module.exports = Therror;
