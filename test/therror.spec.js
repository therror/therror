'use strict';

const Therror = require('../lib/therror');

describe('Therror', function() {
  it('should be able to create a Therror', function() {
    let err = new Therror();

    expect(err).to.be.instanceOf(Error);

    expect(err.name).to.be.eql('Error');
    expect(err.constructor.name).to.be.eql('Therror');
    expect(err.stack).to.exist;
  });

  it('should have the error message', function() {
    let err = new Therror('Something happened');

    expect(err.message).to.be.eql('Something happened');
  });

  it('should be easy to identify Therrors using flag isTherror', function() {
    let err = new Therror('Something happened');

    expect(err.isTherror).to.be.eql(true);
  });

  it('should be able to accept Numbers as message', function() {
    let cause = 1;
    let err = new Therror(cause);

    expect(err.message).to.be.eql(String(cause));
  });

  it('should be able to accept Objects on construction', function() {
    let cause = {
      badDeveloper: true
    };
    let err = new Therror(cause);

    expect(err.message).to.be.eql('Unknown error');
    expect(err).to.have.property('badDeveloper', true);
  });

  it('should be able to accept Objects on construction with a message', function() {
    let cause = {
      badDeveloper: true,
      message: 'Really bad error'
    };
    let err = new Therror(cause);

    expect(err.message).to.be.eql('Really bad error');
    expect(err).to.have.property('badDeveloper', true);
  });

  describe('when specifying causes', function() {
    it('should be able to create a Therror with cause', function() {
      let cause = new Error('Causer error');
      let err = new Therror(cause);

      expect(err.cause()).to.be.eql(cause);
      expect(err.message).to.be.eql('Unknown error');
    });

    it('should be able to create a Therror with cause and message', function() {
      let cause = new Error('Causer error');
      let err = new Therror(cause, 'Something happened');

      expect(err.cause()).to.be.eql(cause);
      expect(err.message).to.be.eql('Something happened');
    });

    it('should be able to create a Therror with cause and message', function() {
      let cause = new Error('Causer error');
      let err = new Therror(cause, 'Something happened');

      expect(err.cause()).to.be.eql(cause);
      expect(err.message).to.be.eql('Something happened');
    });

    it('should be able to accept Numbers as cause and set a message', function() {
      let err = new Therror(1, 'Number error');

      expect(err.cause()).to.be.eql(1);
      expect(err.message).to.be.eql('Number error');
    });

    it('should be able to accept Strings as cause and set a message', function() {
      let err = new Therror('String error', 'Number error');

      expect(err.cause()).to.be.eql('String error');
      expect(err.message).to.be.eql('Number error');
    });

    it('should be able to accept Objects as cause and set a message', function() {
      let cause = {
        badDeveloper: true
      };
      let err = new Therror(cause, '3rd party error');

      expect(err.cause()).to.be.eql(cause);
      expect(err.message).to.be.eql('3rd party error');
      expect(err).to.not.have.property('badDeveloper');
    });
  });

  describe('when specifying properties in the instantiation', function() {

    it('should support adding properties to the error instance', function() {
      let err = new Therror('Something happened', {
        what: 'socks',
        color: 'blue'
      });

      expect(err.what).to.be.eql('socks');
      expect(err.color).to.be.eql('blue');
    });

    it('should support adding several properties objs to the error instance ', function() {
      let err = new Therror('Something happened',
          {what: 'socks'},
          {color: 'blue'}
      );

      expect(err.what).to.be.eql('socks');
      expect(err.color).to.be.eql('blue');
    });

    it('should export the enumerable properties defined', function() {
      let err = new Therror('Something happened', {
        what: 'socks',
        color: 'blue'
      });

      expect(Object.keys(err)).to.be.eql(['what', 'color']);
    });

    it('should be able to generate the message with its properties', function() {
      let err = new Therror('My ${color} ${what}', {
        what: 'socks',
        color: 'blue'
      });

      expect(err.message).to.be.eql('My blue socks');
    });

    it('should be able to set the message when specified as a property', function() {
      let err = new Therror({
        what: 'socks',
        color: 'blue',
        message: 'My ${color} ${what}'
      });

      expect(err.message).to.be.eql('My blue socks');
    });

    it('should use the message when there is a message property', function() {
      let err = new Therror('Use this', {
        message: 'Override'
      });

      expect(err.message).to.be.eql('Use this');
    });

    it('should be able to regenerate the message when the template changes', function() {
      let err = new Therror('My ${color} ${what}', {
        what: 'socks',
        color: 'blue'
      });

      err.message = 'Mis ${what} ${color}';
      expect(err.message).to.be.eql('Mis socks blue');
    });

    it('should be able to parse the message w/o changing the message', function() {
      let err = new Therror('My ${color} ${what}', {
        what: 'socks',
        color: 'blue'
      });

      let message = err.parse('Mis ${what} ${color}');
      expect(err.message).to.be.eql('My blue socks');
      expect(message).to.be.eql('Mis socks blue');
    });

  });

  describe('when extending Therror', function() {
    it('should be able to extend a Therror', function() {
      class MyError extends Therror {}

      let err = new MyError();
      expect(err).to.be.instanceOf(Error);
      expect(err).to.be.instanceOf(Therror);
      expect(err).to.be.instanceOf(MyError);

      expect(err.name).to.be.eql('MyError');
      expect(err.constructor.name).to.be.eql('MyError');
      expect(err.stack).to.exist;
    });

    it('should be able to customize using constructor', function() {
      class MyError extends Therror {
        constructor(data) {
          super('Something ${type}: ${statusCode}', data);
          this.statusCode = 500;
        }
      }

      let err = new MyError({type: 'bad'});

      expect(err.message).to.be.eql('Something bad: 500');
      expect(err.statusCode).to.be.eql(500);
    });

    it('should be able to customize using multiple properties', function() {
      class MyError extends Therror {
        constructor(data) {
          super({
            message: 'Something ${type}: ${statusCode}',
            statusCode: 500
          }, data);
        }
      }

      let err = new MyError({type: 'bad'});

      expect(err.message).to.be.eql('Something bad: 500');
      expect(err.statusCode).to.be.eql(500);
    });

    it('should be able to late def template', function() {
      class MyError extends Therror {
        constructor(data) {
          super(data);
          this.message = 'Something ${type}: ${statusCode}';
          this.statusCode = 500;
        }
      }

      let err = new MyError({type: 'bad'});

      expect(err.message).to.be.eql('Something bad: 500');
      expect(err.statusCode).to.be.eql(500);
    });

    it('should be able to specify the message', function() {
      class MyError extends Therror {
        constructor(str, data) {
          super(str, data);
          this.statusCode = 500;
        }
      }

      let err = new MyError('Something ${type}: ${statusCode}', {type: 'bad'});

      expect(err.message).to.be.eql('Something bad: 500');
      expect(err.statusCode).to.be.eql(500);
    });
  });

  describe('when using mixins', function() {
    function JSONTherror(Base) {
      return class extends(Base) {
        toJSON() {
          return {
            name: this.name,
            message: this.message,
            url: this.url()
          };
        }
      };
    }

    function URLTherror(Base) {
      return class extends Base {
        url() {
          return `http://some.tld/${this.name}`;
        }
      };
    }

    it('should be able to extend classes', function() {
      class MyJSONTherror extends JSONTherror(URLTherror(Therror)) {}

      var err = new MyJSONTherror('Mixins are ${what}', {what: 'cool'});

      expect(err).to.be.instanceOf(Error);
      expect(err).to.be.instanceOf(Therror);
      expect(err).to.be.instanceOf(MyJSONTherror);

      expect(err.name).to.be.eql('MyJSONTherror');
      expect(err.message).to.be.eql('Mixins are cool');
      expect(err.toJSON()).to.be.eql({
        name: 'MyJSONTherror',
        message: 'Mixins are cool',
        url: 'http://some.tld/MyJSONTherror'
      });
    });
  });

  describe('when using Namespaced', function() {
    it('should be able to specify the Namespace on class creation', function() {

      class MyError extends Therror.Namespaced('Server') {}

      let err = new MyError('What a ${what}', {what: 'pitty'});

      expect(err).to.be.instanceOf(Error);
      expect(err).to.be.instanceOf(Therror);
      expect(err).to.be.instanceOf(MyError);

      expect(err.namespace).to.be.eql('Server');
      expect(err.name).to.be.eql('Server.MyError');
      expect(err.message).to.be.eql('What a pitty');
      expect(err.what).to.be.eql('pitty');
    });
  });

  describe('when using Serializable', function() {
    it('should have serializable methods', function() {

      class MyError extends Therror.Serializable() {}

      let err = new MyError('What a ${what}', {what: 'pitty'});

      expect(err).to.be.instanceOf(Error);
      expect(err).to.be.instanceOf(Therror);
      expect(err).to.be.instanceOf(MyError);

      expect(err).to.respondTo('toString');
      expect(err).to.respondTo('toJSON');
      expect(err.message).to.be.eql('What a pitty');
      expect(err.what).to.be.eql('pitty');
    });
  });

  describe('when using Notificator', function () {
    it('should receive an event when a Therror is instantiated', function() {
      let eventSpy = sandbox.spy();
      Therror.on('create', eventSpy);

      class MyError extends Therror.Notificator() {}

      let err = new MyError();

      expect(eventSpy).to.have.been.calledWith(err);
    });
  });

  describe('when using Loggable', function () {
    it('should have a log method', function() {
      let logger = {
        info: sandbox.spy()
      };

      class MyError extends Therror.Loggable('info') {}

      let err = new MyError('What a ${what}', {what: 'pitty'});

      expect(err).to.be.instanceOf(Error);
      expect(err).to.be.instanceOf(Therror);
      expect(err).to.be.instanceOf(MyError);

      expect(err).to.respondTo('log');
      expect(err).to.respondTo('level');

      expect(err.level()).to.be.eql('info');

      expect(Therror.Loggable.logger).to.be.eql(console);
      Therror.Loggable.logger = logger;
      err.log();
      Therror.Loggable.logger = console;

      expect(logger.info).to.have.been.calledWith(err);
    });
  });

  describe('when using WithMessage', function () {
    it('should have common message for all instances', function() {

      class MyError extends Therror.WithMessage('The user ${user} does not exists') {}

      let err = new MyError({user: 'John'});
      let err2 = new MyError(err, {user: 'Sarah'});

      expect(err.message).to.be.eql('The user John does not exists');
      expect(err2.message).to.be.eql('The user Sarah does not exists');
      expect(err2.cause()).to.be.eql(err);
    });

    it('should be able to overwrite the predefined message', function() {

      class MyError extends Therror.WithMessage('The user ${user} does not exists') {}

      let err = new MyError('Overwritten message for ${user}', {user: 'John'});
      let err2 = new MyError(err, 'Another message for ${user}', {user: 'Sarah'});

      expect(err.message).to.be.eql('Overwritten message for John');
      expect(err2.message).to.be.eql('Another message for Sarah');
      expect(err2.cause()).to.be.eql(err);
    });
  });

  describe('when using HTTP', function () {
    it('should create with statusCodes', function() {

      class NotFound extends Therror.HTTP('404') {}
      class ServerError extends Therror.HTTP('500') {}

      let err = new NotFound();
      let err2 = new ServerError(err, 'Boom!');

      expect(err.statusCode).to.exist;
      expect(Object.keys(err)).to.not.contains('statusCode');
      expect(err).to.respondTo('toPayload');

      expect(err.statusCode).to.be.eql(404);
      expect(err.message).to.be.eql('Not Found');
      expect(err.toPayload()).to.be.eql({
        error: 'NotFound',
        message: 'Not Found'
      });

      expect(err2.cause()).to.be.eql(err);
      expect(err2.message).to.be.eql('Boom!');

    });

    it('should create with custom message', function() {

      class UserNotFound extends Therror.HTTP('404') {}

      let err = new UserNotFound('The user ${user} does not exists', {user: 'Sarah'});

      expect(err.statusCode).to.be.eql(404);
      expect(err.message).to.be.eql('The user Sarah does not exists');
      expect(err.toPayload()).to.be.eql({
        error: 'UserNotFound',
        message: 'The user Sarah does not exists'
      });
    });

    it('should have precreated classes for statusCodes', function() {

      let err = new Therror.HTTP.NotFound('The user ${user} does not exists', {user: 'Sarah'});

      expect(err.statusCode).to.be.eql(404);
      expect(err.message).to.be.eql('The user Sarah does not exists');
      expect(err.toPayload()).to.be.eql({
        error: 'NotFound',
        message: 'The user Sarah does not exists'
      });
    });

    it('should hide information to the client', function() {
      let err = new Therror.HTTP.ServiceUnavailable('Database ${type} misconfigured', {type: 'mongo'});

      expect(err.statusCode).to.be.eql(503);
      expect(err.name).to.be.eql('ServiceUnavailable');
      expect(err.message).to.be.eql('Database mongo misconfigured');
      expect(err.toPayload()).to.be.eql({
        error: 'InternalServerError',
        message: 'An internal server error occurred'
      });
    });

    it('should use generic 500 message when not valid statusCode', function() {
      class ServerError extends Therror.HTTP(2312332) {}

      let err = new ServerError();
      let err2 = new ServerError('Boom!');

      expect(err.statusCode).to.be.eql(2312332);
      expect(err.message).to.be.eql('Internal Server Error');
      expect(err2.message).to.be.eql('Boom!');

      expect(err.toPayload()).to.be.eql({
        error: 'InternalServerError',
        message: 'An internal server error occurred'
      });

      expect(err2.toPayload()).to.be.eql({
        error: 'InternalServerError',
        message: 'An internal server error occurred'
      });
    });
  });

  describe('when using ServerError', function () {
    it('should have the four mixins', function() {

      let eventSpy = sandbox.spy();
      Therror.on('create', eventSpy);

      class MyError extends Therror.ServerError({
        level: 'info',
        statusCode: 404,
        message: 'The user is ${user}'
      }) {}

      let cause = new Therror();

      let err = new MyError(cause, {user: 'John'});

      expect(err.user).to.be.eql('John');
      expect(err.cause()).to.be.eql(cause);
      expect(err.message).to.be.eql('The user is John');
      expect(err.level()).to.be.eql('info');
      expect(err.statusCode).to.be.eql(404);
      expect(eventSpy).to.have.been.calledWith(err);
    });

    it('should use defaults', function() {
      class MyError extends Therror.ServerError() {}
      let cause = new Therror();
      let err = new MyError(cause, {user: 'John'});

      expect(err.user).to.be.eql('John');
      expect(err.cause()).to.be.eql(cause);
      expect(err.message).to.be.eql('Service Unavailable');
      expect(err.level()).to.be.eql('error');
      expect(err.statusCode).to.be.eql(503);
    });

    it('should have precreated classes for statusCodes', function() {

      let err = new Therror.ServerError.NotFound('The user ${user} does not exists', {user: 'Sarah'});

      expect(err.statusCode).to.be.eql(404);
      expect(err.message).to.be.eql('The user Sarah does not exists');
      expect(err.toPayload()).to.be.eql({
        error: 'NotFound',
        message: 'The user Sarah does not exists'
      });

    });

    it('should hide information to the client', function() {
      let err = new Therror.ServerError.ServiceUnavailable('Database ${type} misconfigured', {type: 'mongo'});

      expect(err.statusCode).to.be.eql(503);
      expect(err.name).to.be.eql('ServiceUnavailable');
      expect(err.message).to.be.eql('Database mongo misconfigured');
      expect(err.toPayload()).to.be.eql({
        error: 'InternalServerError',
        message: 'An internal server error occurred'
      });
    });

    it('should set string as message for ServerError', function() {
      let cause = '3rd party error';
      let err = new Therror.ServerError.ServiceUnavailable(cause);

      expect(err.statusCode).to.be.eql(503);
      expect(err.name).to.be.eql('ServiceUnavailable');
      expect(err.message).to.be.eql('3rd party error');
      expect(err.toPayload()).to.be.eql({
        error: 'InternalServerError',
        message: 'An internal server error occurred'
      });
    });

    it('should set string as cause for ServerError', function() {
      let cause = '3rd party error';
      let err = new Therror.ServerError.ServiceUnavailable(cause, 'uncaught error');

      expect(err.statusCode).to.be.eql(503);
      expect(err.name).to.be.eql('ServiceUnavailable');
      expect(err.message).to.be.eql('uncaught error');
      expect(err.cause()).to.be.eql(cause);
      expect(err.toPayload()).to.be.eql({
        error: 'InternalServerError',
        message: 'An internal server error occurred'
      });
    });

    it('should set Number as message for ServerError', function() {
      let cause = 1;
      let err = new Therror.ServerError.ServiceUnavailable(cause);

      expect(err.statusCode).to.be.eql(503);
      expect(err.name).to.be.eql('ServiceUnavailable');
      expect(err.message).to.be.eql(String(cause));
      expect(err.toPayload()).to.be.eql({
        error: 'InternalServerError',
        message: 'An internal server error occurred'
      });
    });

    it('should set Number as cause for ServerError', function() {
      let cause = 1;
      let err = new Therror.ServerError.ServiceUnavailable(cause, 'uncaught error');

      expect(err.statusCode).to.be.eql(503);
      expect(err.name).to.be.eql('ServiceUnavailable');
      expect(err.message).to.be.eql('uncaught error');
      expect(err.cause()).to.be.eql(cause);
      expect(err.toPayload()).to.be.eql({
        error: 'InternalServerError',
        message: 'An internal server error occurred'
      });
    });
  });
});
