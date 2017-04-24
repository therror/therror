import Therror from '../lib/therror';
import { Classes } from '../lib/therror';

Therror.on('create', function(error) {
    error.isTherror;
});
let error: Therror;
error = new Therror();
error = new Therror(new Error('cause'));

error = new Therror();
error = new Therror('hola');
error = new Therror('hola ${mundo}', { mundo: 'world' });
error = new Therror(new Error('cause'), 'hola');
error = new Therror(new Error('cause'), 'hola ${mundo}', { mundo: 'world' });

error.message;
error.cause();
error.isTherror;

class MyNamespaced extends Therror.Namespaced('MyNS') {}
let myNamespaced = new MyNamespaced();
myNamespaced.namespace;

class MySerializable extends Therror.Serializable() {}
let mySerializable = new MySerializable();
mySerializable.toJSON();
mySerializable.toString();

class MyNotificator extends Therror.Notificator() {}
let myNotificator = new MyNotificator();
myNotificator.isTherror;

class MyLoggable extends Therror.Loggable('info') {}
let myLoggable = new MyLoggable();
myLoggable.log();
myLoggable.level();
Therror.Loggable.logger = console;

class MyWithMessage extends Therror.WithMessage('hola ${mundo}') {}
let myWithMessage = new MyWithMessage();
myWithMessage.message;

class My404 extends Therror.HTTP(404) {}
class My503 extends Therror.HTTP('503') {}
let my404 = new My404();
my404.toPayload();
my404.statusCode;

class MyCustomServerError extends Therror.ServerError({
    level: 'info',
    statusCode: 402,
    message: 'hola ${mundo}'
}) {}
class MyServerError extends Therror.ServerError() {}
let myServerError = new MyServerError();
myServerError.toPayload();
myServerError.statusCode;
myServerError.log();
myServerError.level;
myServerError.cause();
myServerError.namespace;
myServerError.isTherror;

let notFound = new Therror.ServerError.NotFound();
notFound.toPayload();
notFound.statusCode;
notFound.log();
notFound.level;

interface MyCustom extends Classes.Loggable, Classes.Namespaced {}
class MyCustom extends Therror.Loggable('info', Therror.Namespaced('MyNS')) {}
let myCustom = new MyCustom();
myCustom.isTherror;
myCustom.log();
myCustom.namespace;

class MyCustomNew extends Therror.Loggable('info', Therror.Namespaced('MyNS')) {}
let myCustomNew = new MyCustomNew();
myCustomNew.isTherror;
myCustomNew.log();
myCustomNew.namespace;
