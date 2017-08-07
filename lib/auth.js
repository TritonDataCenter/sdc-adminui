/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var restify = require('restify');
var util = require('util');

var AUTH_TOKEN_HEADER = 'x-adminui-token';
var ACCOUNT_LOCKED_MESSAGE = 'Account is temporarily locked after too many failed auth attempts';
var MAX_LOGIN_ATTEMPTS = 5;
var LOCKED_TIME = 4 * 60 * 60;
var userLockTimes = {};
var userLoginAttempts = {};

var MANTA_ENALBED = require('../etc/config.json')['manta'] || false;
var Auth = module.exports = {};

Auth.optionalAuth = function optionalAuth(req, res, next) {
    var token = req.headers[AUTH_TOKEN_HEADER];

    if (typeof (token) === 'undefined') {
        return next();
    }

    if (!req.sessions) {
        return next(restify.ServiceUnavailableError('Moray unavailable'));
    }

    req.sessions.get(token, function (err, data) {
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

    return null;
};

Auth.requireRole = function requireRole() {
    var roles = Array.prototype.slice.call(arguments);
    return function (req, res, next) {
        if (!req.session) {
            return next(new restify.NotAuthorizedError('Invalid Auth Token'));
        }
        req.log.debug('requireRole', roles);
        req.log.info(req.session.data, 'session data');
        var userRoles = req.session.data.roles;

        for (var i = 0; i < roles.length; i++) {
            var r = roles[i];
            if (userRoles.indexOf(r) !== -1) {
                return next();
            }
        }

        return next(new restify.ForbiddenError('No Permission'));
    };
};

Auth.requireAuth = function requireAuth(req, res, next) {
    if (typeof (req.headers[AUTH_TOKEN_HEADER]) === 'undefined') {
        return next(new restify.NotAuthorizedError(
            util.format('%s not present', AUTH_TOKEN_HEADER)));
    }

    if (!req.sessions) {
        return next(new restify.ServiceUnavailableError('service unavailable (moray)'));
    }

    var token = req.headers[AUTH_TOKEN_HEADER];

    req.sessions.get(token, function (err, data) {
        if (err) {
            err.message = err.message || '';
            return next(new restify.NotAuthorizedError(err.message));
        }

        if (data === null) {
            return next(new restify.NotAuthorizedError('Invalid Auth Token'));
        }

        req.sessions.touch(token);
        req.session = {data: data, token: token};
        return next();
    });

    return null;
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
    var username = params.username;

    if (typeof (username) === 'undefined') {
        return next(new restify.InvalidArgumentError('Username Required'));
    }

    if (typeof (params.password) === 'undefined') {
        return next(new restify.InvalidArgumentError('Password Required'));
    }

    if (typeof (req.sessions) === 'undefined') {
        return next(new restify.ServiceUnavailableError('Service Unavailable (moray)'));
    }

    // set login attempts if UFDS master is not available
    var isSlaveUfds = req.ufdsSlave.connected && !req.ufdsMaster.connected;
    userLoginAttempts[username] = isSlaveUfds && userLoginAttempts[username] || 1;
    req.ufds.getUser(username, function (err, user) {
        if (err) {
            if (err.restCode === 'ResourceNotFound') {
                return next(new restify.ConflictError('The credentials provided are invalid'));
            } else {
                req.log.fatal(err, 'Error while retrieving user via UFDS');
                return next(new restify.InternalError('System Error: ' + err.message));
            }
        }
        var lockedTime = userLockTimes[username] || user.pwdaccountlockedtime;
        var isLocked = lockedTime && lockedTime > Date.now();
        if (isLocked) {
            return next(new restify.ConflictError(ACCOUNT_LOCKED_MESSAGE));
        }
        var pwdEndTime = user.pwdendtime;
        if (pwdEndTime && pwdEndTime <= Date.now()) {
            return next(new restify.ConflictError('Your password has already expired'));
        }
        return doAuth();
    });

    return null;


    function doAuth() {
        req.ufds.authenticate(username, params.password, function (err, user) {
            if (err) {
                if (err.restCode === 'InvalidCredentials' || err.restCode === 'ResourceNotFound') {
                    if (userLoginAttempts[username] > MAX_LOGIN_ATTEMPTS) {
                        req.log.error({username: username}, ACCOUNT_LOCKED_MESSAGE + ' via slave UFDS');
                        userLockTimes[username] = Date.now() + LOCKED_TIME;
                        userLoginAttempts[username] = 0;
                    }
                    userLoginAttempts[username] += 1;
                    return next(new restify.ConflictError('The credentials provided are invalid'));
                }

                if (err.message === 'not connected') {
                    return next(new restify.InternalError('Service Unavailable: Not Connected to UFDS.'));
                }

                req.log.fatal(err, 'Error while attempting user auth via UFDS');
                return next(new restify.InternalError('System Error: ' + err.message));
            }
            if (isSlaveUfds) {
                req.log.warn(user, 'User has been authenticated with the slave UFDS');
            }
            delete userLockTimes[username];
            delete userLoginAttempts[username];

            if (user.isAdmin() === false && user.isReader() === false) {
                return next(new restify.ConflictError('User does not have permission to use Operations Portal.'));
            }

            req.sessions.create({
                roles: user.groups(),
                user: user.uuid,
                manta: MANTA_ENALBED
            }, function (err2, token) {
                if (err2) {
                    req.log.info(err2, 'error creating session');
                    return next(restify.ConflictError('Error creating session'));
                }

                res.send({
                    user: user,
                    token: token,
                    adminUuid: req.adminUuid,
                    manta: MANTA_ENALBED,
                    dc: req.dc,
                    roles: user.groups()
                });
                return next();
            });

            return null;
        });
    }
};

Auth.signout = function signout(req, res, next) {
    var token = req.headers[AUTH_TOKEN_HEADER];
    if (token) {
        req.sessions.destroy(token);
    }
    res.end('');
    return next();
};
