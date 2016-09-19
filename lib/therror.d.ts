/**
 * Therror is a library created for making node error management easy, customizable, interoperable and documentable.
 * Therror errors are javascript errors with sugar. You can use this library to create your application or library errors, and maintain fully interoperability with others code.
 * The sugar is:
 * * variables: Add runtime information to your error messages
 * * extensibility: Pure javascript Error classes with easy ES6 mixins support
 * * nesting: Add the parent cause to your library errors
 * * notifications: Subscribe to events when an error is created: Log them in a single place.
 * * internationalization: Easy to hook your own i18n library to translate error messages
 * * predefined http errors: Standard HTTP Error classes for quick programming * 
 * 
 * @url https://github.com/therror/therror
 * @license Apache-2
 * @copyright Telefonica I+D
 */
interface Therror extends Error {
    /** Is this Error a Therror instance */
    isTherror: boolean;
    /** Gets the error cause, as passed in the constructor */
    cause(): any;
    /** 
     * This is for i18n support. Generates a message based on the provided argument
     * with the error properties replaced.
     * @example
     * ```js
     * let err = new Therror('My ${color} ${what}', {
     *   what: 'socks',
     *   color: 'blue'
     * });
     * 
     * err.message === 'My blue socks';
     * 
     * let message = err.parse('Mis ${what} ${color}');
     * message === 'Mis socks blue';
     * ```
     */
    parse(tpl: string): string;
}

interface TherrorConstructor<T> {
    /** 
     * Create a Therror with the provided message
     */
    new(message?: string): T;
    /** 
     * Creates a Therror with the provided message and properties as its instance properties 
     * The message is a string that supports ES6 template string syntax to print passed properties
     * @example
     * ```js
     * let error = new Therror('${id} invalid', { id: 12 });
     * error.message === '12 invalid';
     * error.id === 12;
     * ```
     */
    new(message?: string, properties?: Properties): T;
    /** 
     * Creates a Therror with 
     *  * the error cause that generated this specific error
     *  * the provided message
     *  * properties as its instance properties 
     * 
     * The message is a string that supports ES6 template string syntax to print passed properties 
     * @example
     * ```js
     * let cause = new Error('validation Failed');
     * let error = new Therror(cause, '${id} invalid', { id: 12 });
     * error.cause() === cause
     * error.message === '12 invalid';
     * error.id === 12;
     * ```
     */
    new(cause?: any, message?: string, properties?: Properties): T;
}

interface TherrorStatic extends TherrorConstructor<Therror> {
    /** Subscribes to error creations for those errors that are ${link Classes.Notificable} */
    on(eventName: Event, callback: (error: Therror) => void): any;
    /**
     * Notifies all subscribers about a new Error
     * @protected
     */
    emit(eventName: Event, payload: Therror): any;
    /** Mixin to prepend a string to the error name  */
    Namespaced: Mixins.Namespaced;
    /** Mixin to add toJSON and toString methods to print expressive error info */
    Serializable: Mixins.Serializable;
    /** Mixin to add notification capabilities to error instances */
    Notificator: Mixins.Notificator;
    /** Mixin to add preconfigured logging capabilities to errors */
    Loggable: Mixins.Loggable;
    /** Mixin to preconfigure a message to errors instances */
    WithMessage: Mixins.WithMessage;
    /** Mixin to express HTTP  errors easily. See also `ServerError` */
    HTTP: Mixins.HTTP;
    /** Mixin to express your Server HTTP errors */
    ServerError: Mixins.ServerError;
}

declare var Therror: TherrorStatic;

export default Therror;

///////////////////

/** Event raised by Therror */
type Event = 'create';

/** Key Value Object */
interface Properties {
    [key:string]: any;
}

export declare namespace Classes {
    export interface Namespaced extends Therror {
        /** The namespace this error belongs to */
        namespace: string;
    }

    export interface Serializable {
        /**
         * Returns a extended description of the error using https://github.com/therror/serr
         * @example
         * ```js
         * let cause = new Error('ENOENT');
         * let error = new FatalError(cause, 'Something went wrong');
         * 
         * console.log('%s', error);
         *   // FatalError: Something went wrong
         *   //    at repl:1:35
         *   //    ...
         *   // Caused by: Error: ENOENT
         *   //    at repl:1:50
         *   //    ...
         */
        toString(): string;
        /**
         * Returns an object describing the error using https://github.com/therror/serr
         * @example
         * ```js
         * let cause = new Error('ENOENT');
         * let error = new FatalError(cause, 'Something went wrong');
         * 
         * console.log('%j', error);
         * // {"message":"Something went wrong","name":"FatalError","constructor":"FatalError",
         * //  "causes":[{"message":"ENOENT","name":"Error","constructor":"Error"}]}
         * ```
         */
        toJSON(): Properties;
    }

    export interface Notificator extends Therror { }

    export interface Loggable {
        /**
         * Logs the error using Therror.Loggable.logger.`level`, where level is the Mixin parameter especified when 
         * defining the Class 
         */
        log(): any;
        /** Gets the log level associated to this error */
        level(): string;
    }

    export interface WithMessage extends Therror { }

    export interface HTTP extends Therror {
        /**
         * The HTTP status code associated to this error
         */
        statusCode: number;
        /**
         * Gets a representation of the error as an literal object meant to be used as 
         * the final response sent to the client as a JSON 
         * When the error `statusCode` is >= 500, it will set in the payload response
         * a generic response to hide the implementation details to the user, while
         * having the original properties untouched to log the error as it was defined
         */
        toPayload(): Properties;
    }

    export interface ServerError extends HTTP, WithMessage, Notificator, Loggable, Namespaced {}
}

declare namespace Mixins {
    interface Namespaced {
        /** 
         * Mixin to prepend the provided parameter to the error name class
         *  
         * @example
         * ```js
         * class InvalidParamError extends Therror.Namespaced('Server') {}
         * let err = new InvalidParamError('Not a valid parameter');
         * err.name === 'Server.InvalidParamError'
         * console.log(err) === '[Server.InvalidParamError: Not a valid parameter]';
         * ```
         */
        (name: string, Base?: TherrorConstructor<Therror>): TherrorConstructor<Classes.Namespaced>;
    }

    interface Serializable {
        /** 
         * Mixin to add toJSON and toString methods to the error, implemented with 
         * https://github.com/therror/serr 
         * 
         * @example
         * ```js
         * class InvalidParamError extends Therror.Namespaced('Server') {}
         * let err = new InvalidParamError('Not a valid parameter');
         * err.name === 'Server.InvalidParamError'
         * console.log(err) === '[Server.InvalidParamError: Not a valid parameter]';
         * ```
         */
        (Base?: TherrorConstructor<Therror>): TherrorConstructor<Classes.Serializable>;
    }

    interface Notificator {
        /** 
         * Mixin to add notification capabilities to this errors: 
         * Its creation will emit a 'create' event, subscribable with Therror.on('create', ...) 
         */
        (Base?: TherrorConstructor<Therror>): TherrorConstructor<Classes.Notificator>;
    }

    interface Loggable {
        /**
         * Mixin to add `log()` and `level()` method to errors
         * `log()` will call the method specified as this mixin parameter in the 
         * Therror.Loggable.logger object so you can preconfigure how an error is logged
         * `level()` simply returns the parameter
         * @example
         * ```js
         * // Set your favourite logger (defaults to console)
         * Therror.Loggable.logger = require('logops');
         * 
         * class NotFoundError extends Therror.Loggable('info') {}
         * 
         * let notFound = new NotFoundError('User Not found');
         * 
         * notFound.log();
         * // calls logger.info(notFound)
         * // INFO  NotFoundError: User Not Found
         * notFound.level(); // 'info' 
         * ```
         */
        (level: string, Base?: TherrorConstructor<Therror>): TherrorConstructor<Classes.Loggable>;
        /**
         * The Logger used to Log Loggable errors
         * @default console
         */
        logger: any;
    }

    interface WithMessage {
        /**
         * Mixin to add preconfigured (and overridable) message to errors
         * @example
         * ```js
         * class NotFoundError extends Therror.WithMessage('The user ${user} does not exists') {}
         * let error = new UserNotFoundError({user: 'John'});
         * // { [UserNotFoundError: The user John does not exists] }
         * ```
         */
        (msg: string, Base?: TherrorConstructor<Therror>): TherrorConstructor<Classes.WithMessage>;
    }

    interface HTTP {
        /**
         * Mixin to add `toPayload()` and `statusCode` to errors. 
         * 
         * _You will likely use `ServerError`, as it has this and other useful mixins._
         * 
         * `toPayload()` gets the error as an object literal, ready to be sent as JSON payload
         * `statusCode` returns the associated status code
         * @example
         * ```js
         * class UserNotFound extends Therror.HTTP('404') {}
         * let err = new UserNotFound('The user ${user} does not exists', {user: 'Sarah'});
         * 
         * // Send the response (Express example)
         * res.statusCode(err.statusCode) // 404
         * res.json(err.toPayload())
         * // {
         * //    error: 'UserNotFound',
         * //    message: 'The user Sarah does not exists'
         * // }
         * ```
         */
        (statusCode: number|string, Base?: TherrorConstructor<Therror>): TherrorConstructor<Classes.HTTP>;
    }

    /**
     * Options to create a ServerError Mixin
     */
    interface ServerErrorOptions {
        /** 
         * The log level associated
         * See `Therror.Loggable`
         * @default 'error'
         */
        level?: string;
        /** 
         * The statusCode associated
         * See `Therror.HTTP` 
         * @default 503
         */
        statusCode?: number | string ;
        /** 
         * The default message for this kind of errors
         * See `Therror.WithMessage`
         * @default to a human readable description for the `statusCode`
         */
        message?: string;
    }

    interface ServerError {
        /**
         * Mixin to add a set of useful tools to make your Server Errors very expressive
         * 
         * Includes `Therror.Notificator`, `Therror.Loggable`, `Therror.WithMessage` and `Therror.HTTP` mixins, 
         * configurable via mixin parameters
         * 
         * A set of all HTTP Errors classes created with this mixin is available as properties in this method ie:
         * `Therror.ServerError.NotFound` 
         * @example
         * ```js
         * class MyServerError extends Therror.ServerError() {};
         * let err = new MyServerError('BD Misconfigured'); 
         * // Log the real error data
         * console.log(err); // [ServiceUnavailable: BD Misconfigured]
         * // but send a hidden response to the client (Express example)
         * res.statusCode(err.statusCode) // 503
         * res.json(err.toPayload())
         * // {
         * //    error: 'InternalServerError',
         * //    message: 'An internal server error occurred'
         * // }
         * err.log(); // executes Therror.Loggable.logger.error(err);
         * ```
         */
        (opts?: ServerErrorOptions, Base?: TherrorConstructor<Therror>): TherrorConstructor<Classes.ServerError>;
        BadRequest: typeof ServerErrors.BadRequest;
        Unauthorized: typeof ServerErrors.Unauthorized;
        PaymentRequired: typeof ServerErrors.PaymentRequired;
        Forbidden: typeof ServerErrors.Forbidden;
        NotFound: typeof ServerErrors.NotFound;
        MethodNotAllowed: typeof ServerErrors.MethodNotAllowed;
        NotAcceptable: typeof ServerErrors.NotAcceptable;
        ProxyAuthenticationRequired: typeof ServerErrors.ProxyAuthenticationRequired;
        RequestTimeout: typeof ServerErrors.RequestTimeout;
        Conflict: typeof ServerErrors.Conflict;
        Gone: typeof ServerErrors.Gone;
        LengthRequired: typeof ServerErrors.LengthRequired;
        PreconditionFailed: typeof ServerErrors.PreconditionFailed;
        RequestEntityTooLarge: typeof ServerErrors.RequestEntityTooLarge;
        RequestUriTooLarge: typeof ServerErrors.RequestUriTooLarge;
        UnsupportedMediaType: typeof ServerErrors.UnsupportedMediaType;
        RequestedRangeNotSatisfiable: typeof ServerErrors.RequestedRangeNotSatisfiable;
        ExpectationFailed: typeof ServerErrors.ExpectationFailed;
        ImATeapot: typeof ServerErrors.ImATeapot;
        UnprocessableEntity: typeof ServerErrors.UnprocessableEntity;
        Locked: typeof ServerErrors.Locked;
        FailedDependency: typeof ServerErrors.FailedDependency;
        UnorderedCollection: typeof ServerErrors.UnorderedCollection;
        UpgradeRequired: typeof ServerErrors.UpgradeRequired;
        PreconditionRequired: typeof ServerErrors.PreconditionRequired;
        TooManyRequests: typeof ServerErrors.TooManyRequests;
        RequestHeaderFieldsTooLarge: typeof ServerErrors.RequestHeaderFieldsTooLarge;
        UnavailableForLegalReasons: typeof ServerErrors.UnavailableForLegalReasons;
        InternalServerError: typeof ServerErrors.InternalServerError;
        NotImplemented: typeof ServerErrors.NotImplemented;
        BadGateway: typeof ServerErrors.BadGateway;
        ServiceUnavailable: typeof ServerErrors.ServiceUnavailable;
        GatewayTimeout: typeof ServerErrors.GatewayTimeout;
        HttpVersionNotSupported: typeof ServerErrors.HttpVersionNotSupported;
        VariantAlsoNegotiates: typeof ServerErrors.VariantAlsoNegotiates;
        InsufficientStorage: typeof ServerErrors.InsufficientStorage;
        BandwidthLimitExceeded: typeof ServerErrors.BandwidthLimitExceeded;
        NotExtended: typeof ServerErrors.NotExtended;
        NetworkAuthenticationRequired: typeof ServerErrors.NetworkAuthenticationRequired;
    }

    namespace ServerErrors {
        interface  BadRequest extends Classes.ServerError {}
        interface  BadRequestConstructor extends TherrorConstructor<BadRequest> {
            /** ServerError with statusCode: 400, message: 'Bad Request', level: 'error' */
            new(): BadRequest;
        }
        export let BadRequest: BadRequestConstructor;

        interface  Unauthorized extends Classes.ServerError {}
        interface  UnauthorizedConstructor extends TherrorConstructor<Unauthorized> {
            /** ServerError with statusCode: 401, message: 'Unauthorized', level: 'error' */
            new(): Unauthorized;
        }
        export let Unauthorized: UnauthorizedConstructor;

        interface  PaymentRequired extends Classes.ServerError {}
        interface  PaymentRequiredConstructor extends TherrorConstructor<PaymentRequired> {
            /** ServerError with statusCode: 402, message: 'Payment Required', level: 'error' */
            new(): PaymentRequired;
        }
        export let PaymentRequired: PaymentRequiredConstructor;

        interface  Forbidden extends Classes.ServerError {}
        interface  ForbiddenConstructor extends TherrorConstructor<Forbidden> {
            /** ServerError with statusCode: 403, message: 'Forbidden', level: 'error' */
            new(): Forbidden;
        }
        export let Forbidden: ForbiddenConstructor;

        interface  NotFound extends Classes.ServerError {}
        interface  NotFoundConstructor extends TherrorConstructor<NotFound> {
            /** ServerError with statusCode: 404, message: 'Not Found', level: 'error' */
            new(): NotFound;
        }
        export let NotFound: NotFoundConstructor;

        interface  MethodNotAllowed extends Classes.ServerError {}
        interface  MethodNotAllowedConstructor extends TherrorConstructor<MethodNotAllowed> {
            /** ServerError with statusCode: 405, message: 'Method Not Allowed', level: 'error' */
            new(): MethodNotAllowed;
        }
        export let MethodNotAllowed: MethodNotAllowedConstructor;

        interface  NotAcceptable extends Classes.ServerError {}
        interface  NotAcceptableConstructor extends TherrorConstructor<NotAcceptable> {
            /** ServerError with statusCode: 406, message: 'Not Acceptable', level: 'error' */
            new(): NotAcceptable;
        }
        export let NotAcceptable: NotAcceptableConstructor;

        interface  ProxyAuthenticationRequired extends Classes.ServerError {}
        interface  ProxyAuthenticationRequiredConstructor extends TherrorConstructor<ProxyAuthenticationRequired> {
            /** ServerError with statusCode: 407, message: 'Proxy Authentication Required', level: 'error' */
            new(): ProxyAuthenticationRequired;
        }
        export let ProxyAuthenticationRequired: ProxyAuthenticationRequiredConstructor;

        interface  RequestTimeout extends Classes.ServerError {}
        interface  RequestTimeoutConstructor extends TherrorConstructor<RequestTimeout> {
            /** ServerError with statusCode: 408, message: 'Request Timeout', level: 'error' */
            new(): RequestTimeout;
        }
        export let RequestTimeout: RequestTimeoutConstructor;

        interface  Conflict extends Classes.ServerError {}
        interface  ConflictConstructor extends TherrorConstructor<Conflict> {
            /** ServerError with statusCode: 409, message: 'Conflict', level: 'error' */
            new(): Conflict;
        }
        export let Conflict: ConflictConstructor;

        interface  Gone extends Classes.ServerError {}
        interface  GoneConstructor extends TherrorConstructor<Gone> {
            /** ServerError with statusCode: 410, message: 'Gone', level: 'error' */
            new(): Gone;
        }
        export let Gone: GoneConstructor;

        interface  LengthRequired extends Classes.ServerError {}
        interface  LengthRequiredConstructor extends TherrorConstructor<LengthRequired> {
            /** ServerError with statusCode: 411, message: 'Length Required', level: 'error' */
            new(): LengthRequired;
        }
        export let LengthRequired: LengthRequiredConstructor;

        interface  PreconditionFailed extends Classes.ServerError {}
        interface  PreconditionFailedConstructor extends TherrorConstructor<PreconditionFailed> {
            /** ServerError with statusCode: 412, message: 'Precondition Failed', level: 'error' */
            new(): PreconditionFailed;
        }
        export let PreconditionFailed: PreconditionFailedConstructor;

        interface  RequestEntityTooLarge extends Classes.ServerError {}
        interface  RequestEntityTooLargeConstructor extends TherrorConstructor<RequestEntityTooLarge> {
            /** ServerError with statusCode: 413, message: 'Request Entity Too Large', level: 'error' */
            new(): RequestEntityTooLarge;
        }
        export let RequestEntityTooLarge: RequestEntityTooLargeConstructor;

        interface  RequestUriTooLarge extends Classes.ServerError {}
        interface  RequestUriTooLargeConstructor extends TherrorConstructor<RequestUriTooLarge> {
            /** ServerError with statusCode: 414, message: 'Request-URI Too Large', level: 'error' */
            new(): RequestUriTooLarge;
        }
        export let RequestUriTooLarge: RequestUriTooLargeConstructor;

        interface  UnsupportedMediaType extends Classes.ServerError {}
        interface  UnsupportedMediaTypeConstructor extends TherrorConstructor<UnsupportedMediaType> {
            /** ServerError with statusCode: 415, message: 'Unsupported Media Type', level: 'error' */
            new(): UnsupportedMediaType;
        }
        export let UnsupportedMediaType: UnsupportedMediaTypeConstructor;

        interface  RequestedRangeNotSatisfiable extends Classes.ServerError {}
        interface  RequestedRangeNotSatisfiableConstructor extends TherrorConstructor<RequestedRangeNotSatisfiable> {
            /** ServerError with statusCode: 416, message: 'Requested Range Not Satisfiable', level: 'error' */
            new(): RequestedRangeNotSatisfiable;
        }
        export let RequestedRangeNotSatisfiable: RequestedRangeNotSatisfiableConstructor;

        interface  ExpectationFailed extends Classes.ServerError {}
        interface  ExpectationFailedConstructor extends TherrorConstructor<ExpectationFailed> {
            /** ServerError with statusCode: 417, message: 'Expectation Failed', level: 'error' */
            new(): ExpectationFailed;
        }
        export let ExpectationFailed: ExpectationFailedConstructor;

        interface  ImATeapot extends Classes.ServerError {}
        interface  ImATeapotConstructor extends TherrorConstructor<ImATeapot> {
            /** ServerError with statusCode: 418, message: 'I'm a teapot', level: 'error' */
            new(): ImATeapot;
        }
        export let ImATeapot: ImATeapotConstructor;

        interface  UnprocessableEntity extends Classes.ServerError {}
        interface  UnprocessableEntityConstructor extends TherrorConstructor<UnprocessableEntity> {
            /** ServerError with statusCode: 422, message: 'Unprocessable Entity', level: 'error' */
            new(): UnprocessableEntity;
        }
        export let UnprocessableEntity: UnprocessableEntityConstructor;

        interface  Locked extends Classes.ServerError {}
        interface  LockedConstructor extends TherrorConstructor<Locked> {
            /** ServerError with statusCode: 423, message: 'Locked', level: 'error' */
            new(): Locked;
        }
        export let Locked: LockedConstructor;

        interface  FailedDependency extends Classes.ServerError {}
        interface  FailedDependencyConstructor extends TherrorConstructor<FailedDependency> {
            /** ServerError with statusCode: 424, message: 'Failed Dependency', level: 'error' */
            new(): FailedDependency;
        }
        export let FailedDependency: FailedDependencyConstructor;

        interface  UnorderedCollection extends Classes.ServerError {}
        interface  UnorderedCollectionConstructor extends TherrorConstructor<UnorderedCollection> {
            /** ServerError with statusCode: 425, message: 'Unordered Collection', level: 'error' */
            new(): UnorderedCollection;
        }
        export let UnorderedCollection: UnorderedCollectionConstructor;

        interface  UpgradeRequired extends Classes.ServerError {}
        interface  UpgradeRequiredConstructor extends TherrorConstructor<UpgradeRequired> {
            /** ServerError with statusCode: 426, message: 'Upgrade Required', level: 'error' */
            new(): UpgradeRequired;
        }
        export let UpgradeRequired: UpgradeRequiredConstructor;

        interface  PreconditionRequired extends Classes.ServerError {}
        interface  PreconditionRequiredConstructor extends TherrorConstructor<PreconditionRequired> {
            /** ServerError with statusCode: 428, message: 'Precondition Required', level: 'error' */
            new(): PreconditionRequired;
        }
        export let PreconditionRequired: PreconditionRequiredConstructor;

        interface  TooManyRequests extends Classes.ServerError {}
        interface  TooManyRequestsConstructor extends TherrorConstructor<TooManyRequests> {
            /** ServerError with statusCode: 429, message: 'Too Many Requests', level: 'error' */
            new(): TooManyRequests;
        }
        export let TooManyRequests: TooManyRequestsConstructor;

        interface  RequestHeaderFieldsTooLarge extends Classes.ServerError {}
        interface  RequestHeaderFieldsTooLargeConstructor extends TherrorConstructor<RequestHeaderFieldsTooLarge> {
            /** ServerError with statusCode: 431, message: 'Request Header Fields Too Large', level: 'error' */
            new(): RequestHeaderFieldsTooLarge;
        }
        export let RequestHeaderFieldsTooLarge: RequestHeaderFieldsTooLargeConstructor;

        interface  UnavailableForLegalReasons extends Classes.ServerError {}
        interface  UnavailableForLegalReasonsConstructor extends TherrorConstructor<UnavailableForLegalReasons> {
            /** ServerError with statusCode: 451, message: 'Unavailable For Legal Reasons', level: 'error' */
            new(): UnavailableForLegalReasons;
        }
        export let UnavailableForLegalReasons: UnavailableForLegalReasonsConstructor;

        interface  InternalServerError extends Classes.ServerError {}
        interface  InternalServerErrorConstructor extends TherrorConstructor<InternalServerError> {
            /** ServerError with statusCode: 500, message: 'Internal Server Error', level: 'error' */
            new(): InternalServerError;
        }
        export let InternalServerError: InternalServerErrorConstructor;

        interface  NotImplemented extends Classes.ServerError {}
        interface  NotImplementedConstructor extends TherrorConstructor<NotImplemented> {
            /** ServerError with statusCode: 501, message: 'Not Implemented', level: 'error' */
            new(): NotImplemented;
        }
        export let NotImplemented: NotImplementedConstructor;

        interface  BadGateway extends Classes.ServerError {}
        interface  BadGatewayConstructor extends TherrorConstructor<BadGateway> {
            /** ServerError with statusCode: 502, message: 'Bad Gateway', level: 'error' */
            new(): BadGateway;
        }
        export let BadGateway: BadGatewayConstructor;

        interface  ServiceUnavailable extends Classes.ServerError {}
        interface  ServiceUnavailableConstructor extends TherrorConstructor<ServiceUnavailable> {
            /** ServerError with statusCode: 503, message: 'Service Unavailable', level: 'error' */
            new(): ServiceUnavailable;
        }
        export let ServiceUnavailable: ServiceUnavailableConstructor;

        interface  GatewayTimeout extends Classes.ServerError {}
        interface  GatewayTimeoutConstructor extends TherrorConstructor<GatewayTimeout> {
            /** ServerError with statusCode: 504, message: 'Gateway Timeout', level: 'error' */
            new(): GatewayTimeout;
        }
        export let GatewayTimeout: GatewayTimeoutConstructor;

        interface  HttpVersionNotSupported extends Classes.ServerError {}
        interface  HttpVersionNotSupportedConstructor extends TherrorConstructor<HttpVersionNotSupported> {
            /** ServerError with statusCode: 505, message: 'HTTP Version Not Supported', level: 'error' */
            new(): HttpVersionNotSupported;
        }
        export let HttpVersionNotSupported: HttpVersionNotSupportedConstructor;

        interface  VariantAlsoNegotiates extends Classes.ServerError {}
        interface  VariantAlsoNegotiatesConstructor extends TherrorConstructor<VariantAlsoNegotiates> {
            /** ServerError with statusCode: 506, message: 'Variant Also Negotiates', level: 'error' */
            new(): VariantAlsoNegotiates;
        }
        export let VariantAlsoNegotiates: VariantAlsoNegotiatesConstructor;

        interface  InsufficientStorage extends Classes.ServerError {}
        interface  InsufficientStorageConstructor extends TherrorConstructor<InsufficientStorage> {
            /** ServerError with statusCode: 507, message: 'Insufficient Storage', level: 'error' */
            new(): InsufficientStorage;
        }
        export let InsufficientStorage: InsufficientStorageConstructor;

        interface  BandwidthLimitExceeded extends Classes.ServerError {}
        interface  BandwidthLimitExceededConstructor extends TherrorConstructor<BandwidthLimitExceeded> {
            /** ServerError with statusCode: 509, message: 'Bandwidth Limit Exceeded', level: 'error' */
            new(): BandwidthLimitExceeded;
        }
        export let BandwidthLimitExceeded: BandwidthLimitExceededConstructor;

        interface  NotExtended extends Classes.ServerError {}
        interface  NotExtendedConstructor extends TherrorConstructor<NotExtended> {
            /** ServerError with statusCode: 510, message: 'Not Extended', level: 'error' */
            new(): NotExtended;
        }
        export let NotExtended: NotExtendedConstructor;

        interface  NetworkAuthenticationRequired extends Classes.ServerError {}
        interface  NetworkAuthenticationRequiredConstructor extends TherrorConstructor<NetworkAuthenticationRequired> {
            /** ServerError with statusCode: 511, message: 'Network Authentication Required', level: 'error' */
            new(): NetworkAuthenticationRequired;
        }
        export let NetworkAuthenticationRequired: NetworkAuthenticationRequiredConstructor;
    }
}