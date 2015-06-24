'use strict';

var therror = require('../lib/therror');

describe('Therror', function() {

  describe('Namespaces', function() {
    it('Should be able to create namespaces', function() {
      expect(therror.register).to.be.a('function');
      var description = {
            ERR: {}
          },
          ns = therror.register('NS', description);

      expect(ns).to.be.an('object');
      expect(ns).to.have.property('ERR');
    });

    it('Should throw when no valid namespace name provided', function() {
      var fn = function() {
        therror.register();
      };
      var fn3 = function() {
        therror.register([]);
      };
      var fn4 = function() {
        therror.register(4);
      };
      var fn5 = function() {
        therror.register('');
      };

      var errorMessage = /Namespace name you provided is/;

      expect(fn).to.throw(errorMessage);
      expect(fn3).to.throw(errorMessage);
      expect(fn4).to.throw(errorMessage);
      expect(fn5).to.throw(errorMessage);
    });

    it('Should be able to add more errors to namespaces', function() {
      var description = {
            ERR: {}
          },
          description2 = {
            ERR2: {}
          }, ns;
      therror.register('NS', description);
      ns = therror.register('NS', description2);

      expect(ns).to.be.an('object');
      expect(ns).to.have.property('ERR');
      expect(ns).to.have.property('ERR2');
    });

    it('Should be able to get an error namespace', function() {
      var description = {
            ERR: {}
          },
          ns = therror.register('NS', description),
          getNs = therror.namespace('NS');

      expect(getNs).to.be.deep.equal(ns);
    });
  });


  it('Should throw when no valid errors description are provided', function() {
    var fn = function() {
      therror.register('foo');
    };
    var fn2 = function() {
      therror.register('foo', []);
    };
    var fn3 = function() {
      therror.register('foo', '');
    };
    var errorMessage = /Error description is mandatory/;

    expect(fn).to.throw(errorMessage);
    expect(fn2).to.throw(errorMessage);
    expect(fn3).to.throw(errorMessage);
  });

  describe('Global Namespace', function() {
    it('Should be able to register errors in the global namespace', function() {
      var description = {
            ERR: {}
          },
          ns = therror.register(description);

      expect(ns.ERR()).to.be.an.instanceOf(Error);
    });

    it('Should give only the error type when no namespace is set', function() {
      var description = {
            ERR: {}
          },
          ns = therror.register(description),
          err = ns.ERR();

      expect(err.name).to.be.equal('ERR');
    });

    it('Should be able to get errors without namespace', function() {
      var description = {
            ERR: {}
          },
          ns = therror.register(description),
          getNs = therror.namespace();

      expect(getNs).to.be.deep.equal(ns);
    });
  });

  it('Should be an instance of Error', function() {
    var description = {
          ERR: {}
        },
        ns = therror.register('NS', description);

    expect(ns.ERR()).to.be.an.instanceOf(Error);
  });

  it('Should propagate defined properties to therror instantiations', function() {
    var description = {
          ERR: {
            foo: 1,
            bar: 'baz'
          }
        },
        ns = therror.register('NS', description),
        error = ns.ERR();

    expect(error).to.have.property('foo', 1);
    expect(error).to.have.property('bar', 'baz');
  });

  it('Should set the Error name', function() {
    var description = {
          ERR: {
            foo: 1,
            bar: 'baz'
          }
        },
        ns = therror.register('NS', description),
        error = ns.ERR();

    expect(error.name).to.be.equal('NS.ERR');
  });

  it('Should store the arguments on creation', function() {
    var description = {
          ERR: {}
        },
        ns = therror.register('NS', description),
        error = ns.ERR('hello', 'catil');

    expect(error._args).to.be.deep.equal(['hello', 'catil']);
  });

  it('Should store the useful properties on creation', function() {
    var description = {
          ERR: {
            message: 'foo {1} {2}'
          }
        },
        ns = therror.register('NS', description),
        error = ns.ERR('hello', 'catil');

    expect(error._namespace).to.be.equal('NS');
    expect(error._type).to.be.equal('ERR');
    expect(error._message).to.be.equal('foo {1} {2}');
  });

  describe('Error Messages', function() {
    it('Should be able to generate default error message', function() {
      var description = {
            ERR: {
              message: 'Error description'
            }
          },
          ns = therror.register('NS', description),
          error = ns.ERR();

      expect(error.message).to.be.equal('Error description');
    });

    it('Should be able to add the parameters to the error message', function() {
      var description = {
            ERR: {
              message: 'This {2} {1}'
            }
          },
          ns = therror.register('NS', description),
          error = ns.ERR('it', 'is');

      expect(error.message).to.be.equal('This is it');
    });

    it('Should be add the unused parameters to the end of the error message', function() {
      var description = {
            ERR: {
              message: 'This {1} unfortunately'
            }
          },
          ns = therror.register('NS', description),
          error = ns.ERR('is', 'unused');

      expect(error.message).to.be.equal('This is unfortunately unused');
    });

    it('Should leave unused parameters ids in the message ', function() {
      var description = {
            ERR: {
              message: 'This {1} unfortunately {2}'
            }
          },
          ns = therror.register('NS', description),
          error = ns.ERR('is');

      expect(error.message).to.be.equal('This is unfortunately {2}');
    });

    it('Should use args when no message is used', function() {
      var description = {
            ERR: {}
          },
          ns = therror.register('NS', description),
          error = ns.ERR('is', 'optional');

      expect(error.message).to.be.equal('is optional');
    });

    it('Should be able to add Errors messages to parameters', function() {
      var description = {
            ERR: {
              message: 'A {1}'
            }
          },
          ns = therror.register('NS', description),
          otherError = new Error('Other error'),
          error = ns.ERR(otherError);

      expect(error.message).to.be.equal('A Other error');
    });

    it('Should leave arguments intact after computing messages', function() {
      var description = {
            ERR: {
              message: 'A {1}'
            }
          },
          ns = therror.register('NS', description),
          error = ns.ERR('bar');

      expect(error.message).to.be.equal('A bar');
      expect(error._args).to.be.deep.equal(['bar']);

    });
  });

  it('Should be able to emit an event when an error is created', function() {
    var description = {
          ERR: {}
        },
        ns = therror.register('NS', description),
        spy = sinon.spy();

    therror.on('create', spy);
    var error = ns.ERR();

    expect(spy).to.have.been.calledWith(error);
  });

  it('Should be able to emit an event when an error is created', function() {
    var description = {
          ERR: {}
        },
        ns = therror.register('NS', description),
        spy = sinon.spy();

    ns.on('create', spy);
    var error = ns.ERR();

    expect(spy).to.have.been.calledWith(error);
  });

  it('Should be able to add custom attributes per namespace', function() {
    var description = {
          ERR: {
            message: 'A {1} message'
          }
        },
        customs = {
          toJSON: function toJSON() {
            return {
              msg: this.message
            };
          },
          space: 'jam'
        },
        ns = therror.register('NS', description, customs);

    var error = ns.ERR('nice');
    expect(error).to.respondTo('toJSON');
    expect(error.toJSON()).to.be.deep.equal({
      msg: 'A nice message'
    });
    expect(error).to.have.property('space', 'jam');
  });

  it('Should be able to call init function for further initialization', function() {
    var description = {
          ERR: {}
        },
        customs = {
          init: function init() {
            this.initialized = 'yes';
          }
        },
        ns = therror.register('NS', description, customs),
        error = ns.ERR();

    expect(error).to.have.property('initialized', 'yes');
  });

  describe('Stringify parameters', function() {
    var err;
    before(function() {
      err = new therror.Error();
    });

    it('Should be able to stringify Strings', function() {
      expect(err.stringify('string')).to.be.equal('string');
    });

    it('Should be able to stringify undefined', function() {
      expect(err.stringify()).to.be.equal('undefined');
    });

    it('Should be able to stringify Error', function() {
      expect(err.stringify(new Error('foo'))).to.be.equal('foo');
    });

    it('Should be able to stringify stringifiable objects', function() {
      var obj = {
        toString: function() {
          return 'foo';
        }
      };
      expect(err.stringify(obj)).to.be.equal('foo');
    });

    it('Should be able to stringify jsonificable objects', function() {
      var obj = {
        toJSON: function() {
          return {
            foo: 'bar'
          };
        }
      };
      expect(JSON.parse(err.stringify(obj))).to.be.deep.equal({
        foo: 'bar'
      });
    });
  });
});
