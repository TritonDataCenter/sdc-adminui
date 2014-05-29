var restify = require('restify');
var util = require('util');

var AUTH_TOKEN_HEADER = 'x-adminui-token';


var Auth = module.exports = {};

Auth.optionalAuth = function optionalAuth(req, res, next) {
    var token = req.headers[AUTH_TOKEN_HEADER];

    if (typeof(token) === 'undefined') {
        return next();
    }

    if (!req.sessions) {
        return next(restify.ServiceUnavailableError('Moray unavailable'));
    }

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



Auth.requireRole = function requireRole() {
    var roles = Array.prototype.slice.call(arguments);
    return function(req, res, next) {
        if (!req.session) {
            return next(new restify.NotAuthorizedError('Invalid Auth Token'));
        }
        req.log.debug('requireRole', roles);
        req.log.info(req.session.data, 'session data');
        var userRoles = req.session.data.roles;
        roles.forEach(function(r) {
            if (userRoles.indexOf(r) !== -1) {
                return next();
            }
            return next(new restify.ForbiddenError('No Permission'));
        });
    };
};




Auth.requireAuth = function requireAuth(req, res, next) {
    if (typeof(req.headers[AUTH_TOKEN_HEADER]) === 'undefined') {
        return next(new restify.NotAuthorizedError(
            util.format('%s not present', AUTH_TOKEN_HEADER)
        ));
    }

    if (! req.sessions) {
        return next(new restify.ServiceUnavailableError('service unavailable (moray)'));
    }

    var token = req.headers[AUTH_TOKEN_HEADER];

    req.sessions.get(token, function(err, data) {
        if (err) {
            err.message = err.message || '';
            return next(new restify.NotAuthorizedError(err.message));
        }

        if (data === null) {
            return next(new restify.NotAuthorizedError('Invalid Auth Token'));
        }

        req.sessions.touch(token);
        req.session = { data: data, token: token };
        return next();
    });
};








Auth.getAuth = function getAuth(req, res, next) {
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
Auth.authenticate = function authenticate(req, res, next) {
    var params = req.body;
    if (typeof (params.username) === 'undefined') {
        return next(new restify.InvalidArgumentError('Username Required'));
    }

    if (typeof (params.password) === 'undefined') {
        return next(new restify.InvalidArgumentError('Password Required'));
    }

    if (typeof(req.sessions) === 'undefined') {
        return next(new restify.ServiceUnavailableError('Service Unavailable (ufds)'));
    }

    req.ufds.authenticate(params.username, params.password, function (err, user) {
        if (err) {
            if (err.restCode === 'InvalidCredentials' || err.restCode === 'ResourceNotFound') {
                return next(new restify.ConflictError('The credentials provided are invalid'));
            }

            if (err.message === "not connected") {
                return next(new restify.InternalError('Service Unavailable: Not Connected to UFDS.'));
            }

            req.log.fatal(err, 'Error while attempting user auth via UFDS');
            return next(new restify.InternalError('System Error: ' + err.message));
        }



        if (user.isAdmin() === false && user.isReader() === false) {
            return next(new restify.ConflictError('User does not have permission to use Operations Portal.'));
        }

        req.sessions.create({
            roles: user.groups(),
            user: user.uuid
        }, function (err, token) {
            res.send({
                user: user,
                token: token,
                adminUuid: req.adminUuid,
                dc: req.dc,
                roles: user.groups()
            });
            next();
        });
    });
};






Auth.signout = function signout(req, res, next) {
    var token = req.headers[AUTH_TOKEN_HEADER];
    if (token) {
        req.sessions.destroy(token);
    }
    res.end('');
    return next();
};
