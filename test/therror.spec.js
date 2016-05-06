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

  it('should be able to create a Therror with cause', function() {
    let cause = new Error('Causer error');
    let err = new Therror(cause);

    expect(err.cause()).to.be.eql(cause);
  });

  it('should be able to create a Therror with cause and message', function() {
    let cause = new Error('Causer error');
    let err = new Therror(cause, 'Something happened');

    expect(err.cause()).to.be.eql(cause);
    expect(err.message).to.be.eql('Something happened');
  });

  it('should be easy to identify Therrors using flag isTherror', function() {
    let cause = new Error('Causer error');
    let err = new Therror(cause);

    expect(err.isTherror).to.be.eql(true);
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
  })
});
