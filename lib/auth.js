var restify = require('restify');
var util = require('util');


var AUTH_TOKEN_HEADER = 'x-adminui-token';


var Auth = module.exports = {};

Auth.optionalAuth = function (req, res, next) {
    var token = req.headers[AUTH_TOKEN_HEADER];

    if (typeof(token) === 'undefined')
        return next();

    req.sessions.get(token, function(err, data) {
        if (err) {
            return next(err);
        }

        if (data === null) {
            return next();
        }

        req.session = {
            token: token,
            data: data
        };

        return next();
    });
};

Auth.requireAuth = function (req, res, next) {
    if (typeof(req.headers[AUTH_TOKEN_HEADER]) === 'undefined') {
        return next(new restify.NotAuthorizedError(
            util.format('%s not present', AUTH_TOKEN_HEADER)
        ));
    }

    var token = req.headers[AUTH_TOKEN_HEADER];

    req.sessions.get(token, function(err, data) {
        if (err) {
            return next(new restify.NotAuthorizedError(err.message));
        }

        if (data === null) {
            return next(new restify.NotAuthorizedError('Invalid Auth Token'));
        }

        req.sessions.touch(token);
        req.session = {
           data: data,
           token: token
        };
        return next();
    });
};


Auth.getAuth = function (req, res, next) {
    if (req.session) {
        res.send(req.session);
        return next();
    } else {
        return next(new restify.NotFoundError('No Session Data'));
    }
};

/**
* authenticate
*
* @requires
* - req.sessions
* - req.ufds
*
* @param username {String} username
* @param password {String} password
*/
Auth.authenticate = function (req, res, next) {
    var params = req.body;
    if (typeof (params.username) === 'undefined') {
        return next(new restify.InvalidArgumentError('Username Required'));
    }

    if (typeof (params.password) === 'undefined') {
        return next(new restify.InvalidArgumentError('Password Required'));
    }

    req.sdc.ufds.authenticate(params.username, params.password, function (err, user) {
        if (err) {
            req.log.fatal(err);
            return next(new restify.InternalError(err.message));
        }

        req.sessions.create({uuid: user.uuid}, function (err, token) {
            res.send({ user: user, token: token });
            next();
        });
    });
};

Auth.signout = function (req, res, next) {
    req.session.destroy();
    res.end('');
    return next();
};