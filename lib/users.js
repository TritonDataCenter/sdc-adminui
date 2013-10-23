var uuid = require('node-uuid').uuid;
var sprintf = require('util').format;
var errors = require('./errors');
var restify = require('restify');
var async = require('async');

var MORAY_UFDS_BUCKET = 'ufds_o_smartdc';

module.exports = {
    create: createUser,
    count: count,
    list: list,
    get: getUser,
    countUsers: countUsers,
    update: update,
    listKeys: listKeys,
    addKey: addKey,
    deleteKey: deleteKey,
    getLimits: getLimits,
    addLimit: addLimit,
    deleteLimit: deleteLimit,
    updateLimit: updateLimit,
    getTwoFactorAuthStatus: getTwoFactorAuthStatus,
    updateTwoFactorAuthStatus: updateTwoFactorAuthStatus
};


function getUser(req, res, next) {
    var login = req.params.login;
    req.ufdsMaster.getUser(login, function(err, user) {
        if (err) {
            return next(err);
        }

        res.send(user);
        return next();
    });
}

function countUsers(req, res, next) {
    var opts = {
        scope: 'one',
        attributes: ['*'],
        filter: '(&(objectclass=sdcperson))'
    };

    req.ufds.search('ou=users,o=smartdc', opts, function(err, users) {
        if (err) {
            return next(err);
        }

        res.send({
            count: users.length
        });
        return next();
    });
}

function makeWildcardFilter(f, q) {
    var filters = [];
    var capitalized = q.toLowerCase().replace(/(^|\s)([a-z])/g, function (m, p1, p2) {
        return p1 + p2.toUpperCase();
    });

    filters.push(sprintf('(%s=*%s*)', f, q));
    filters.push(sprintf('(%s=*%s*)', f, q.toLowerCase()));
    filters.push(sprintf('(%s=*%s*)', f, q.toUpperCase()));
    filters.push(sprintf('(%s=*%s*)', f, capitalized));

    return filters;
}

function list(req, res, next) {

    var filter = '(objectclass=sdcperson)';
    var ldapquery = '';
    var filters = [];

    if (req.query.q) {
        var q = req.query.q;

        filters = filters.concat(makeWildcardFilter('company', q));
        filters = filters.concat(makeWildcardFilter('givenname', q));
        filters = filters.concat(makeWildcardFilter('sn', q));
        filters = filters.concat(makeWildcardFilter('login', q));
        filters = filters.concat(makeWildcardFilter('email', q));
        filters.push(sprintf('(uuid=%s)', q));

        ldapquery = sprintf('(&%s(|%s))', filter, filters.join(''));

        req.log.info('Users filter query', ldapquery);
    } else {
        if (req.params.uuid) {
            filter = filter + sprintf('(uuid=%s)', req.params.uuid);
        }

        if (req.params.email) {
            filter = filter + sprintf('(email=%s*)', req.params.email);
        }

        if (req.params.cn) {
            filter = filter + sprintf('(cn=%s*)', req.params.cn);
        }

        if (req.params.givenname) {
            filter = filter + sprintf('(givenname=%s*)', req.params.givenname);
        }

        if (req.params.company) {
            filter = filter + sprintf('(company=%s*)', req.params.company);
        }

        if (req.params.sn) {
            filter = filter + sprintf('(sn=%s*)', req.params.sn);
        }

        if (req.params.login) {
            filter = filter + sprintf('(login=%s*)', req.params.login);
        }


        ldapquery = sprintf('(&%s)', filter);
    }


    var perPage = req.params.per_page || 1000;
    var page = req.params.page || 1;

    delete req.params.per_page;
    delete req.params.page;

    var opts = {};
    opts.limit = perPage;
    opts.offset = (page-1) * perPage;
    opts.sort = {
        attribute: 'login',
        order: 'ASC'
    };

    var count = null;
    var mReq = req.sdc[req.dc].moray.findObjects(MORAY_UFDS_BUCKET, ldapquery, opts);
    var entries = [];

    mReq.once('error', function(err) {
        req.log.fatal(err, 'UFDS error when searching for users');
        return next(err);
    });

    mReq.on('record', function(obj) {
        var entry = {};
        count = obj._count;
        var keys = Object.keys(obj.value);

        keys.forEach(function(k) {
            if (k.slice(0, 1) !== '_' && obj.value.hasOwnProperty(k)) {
                entry[k] = obj.value[k][0];
            }
        });

        entries.push(entry);
    });

    mReq.on('end', function() {
        if (count) {
            res.setHeader('x-object-count', count.toString());
        }
        res.send(entries);
        return next();
    });
}

function listKeys(req, res, next) {
    req.ufds.listKeys(req.params.uuid, function(err, keys) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(keys);
            return next();
        }
    });
}


function deleteKey(req, res, next) {
    var user = req.params.uuid;
    var fingerprint = req.params.fingerprint;
    req.ufdsMaster.deleteKey(user, fingerprint, function(err) {
        if (err) {
            return next(err);
        } else {
            res.send({});
            return next();
        }
    });
}

function addKey(req, res, next) {
    var user = req.params.uuid;
    var key = {
        openssh: req.body.key
    };

    if (req.body.name && req.body.name.length) {
        key.name = req.body.name;
    }

    var errs = [];

    if (!req.body.key) {
        errs.push({
            field: 'key',
            code: 'Missing',
            message: 'SSH Key Required'
        });
    }

    if (errs.length) {
        return next(new errors.ValidationFailedError('An ssh Key must be provided', errs));
    }

    function _onError(err) {
        var error = new errors.ValidationFailedError(err.message, [{
            field: 'key',
            code: 'Invalid'
        }]);
        return next(error);
    }

    try {
        req.ufdsMaster.addKey(user, key, function(err, key) {
            if (err) {
                _onError(err);
            } else {
                res.send(key);
                return next();
            }
        });
    } catch (e) {
        _onError(e);
    }
}

function count(req, res, next) {
    var opts = {
        scope: 'one',
        attributes: ['*', 'memberof'],
        filter: '(objectclass=sdcperson)'
    };

    req.ufds.search('ou=users, o=smartdc', opts, function(err, u) {
        res.send({
            count: u.length
        });
    });
}

function update(req, res, next) {
    var uuid = req.params.uuid;
    req.ufdsMaster.getUser(uuid, _getUserCallback);

    function _getUserCallback(err, user) {
        if (err) {
            req.log.fatal(err, 'Error retrieving user from UFDS');
            return next(err);
        }


        var changes = {};

        if (req.body.login) {
            changes['login'] = req.body.login;
        }

        if (req.body.cn) {
            changes['cn'] = req.body.cn;
        }

        if (req.body.cn) {
            changes['cn'] = req.body.cn;
        }

        if (req.body.givenname) {
            changes['givenname'] = req.body.givenname;
        }

        if (req.body.sn) {
            changes['sn'] = req.body.sn;
        }
        if (req.body.company) {
            changes['company'] = req.body.company;
        }
        if (req.body.phone) {
            changes['phone'] = req.body.phone;
        }
        if (req.body.password) {
            changes['userpassword'] = req.body.password;
        }
        if (req.body.email) {
            changes['email'] = req.body.email;
        }
        if (req.body.approved_for_provisioning) {
            changes['approved_for_provisioning'] = req.body.approved_for_provisioning;
        } else {
            changes['approved_for_provisioning'] = 'false';
        }
        if (req.body.registered_developer) {
            changes['registered_developer'] = req.body.registered_developer;
        } else {
            changes['registered_developer'] = 'false';
        }

        updateUserGroups(user, req.body.groups, function(err) {
            if (err) {
                req.log.fatal(err, 'Error moditifying user group membership');
                return next(new errors.InvalidParameterError("Error modifying user group membership",
                    [translateUfdsError(err)]
                    ));
            }
            req.ufdsMaster.updateUser(uuid, changes, _updateUserCallback);
        });
    }


    function _updateUserCallback(err) {
        if (err) {
            req.log.fatal(err, 'Error updating user from UFDS');
            return next(new errors.InvalidParameterError("Error creating user",
                [translateUfdsError(err)]
                ));
        }

        req.ufdsMaster.getUser(uuid, function(err, user) {
            res.send(user);
            return next();
        });
    }
}




function translateUfdsError(err) {

    if (err.message === 'passwordInHistory') {
        return {
            code: 'Invalid',
            field: 'password',
            message: 'Password was used previously.'
        };
    }

    if (err.message === 'insufficientPasswordQuality') {
        return {
            field: 'password',
            code: 'InsufficientPasswordQuality',
            message: 'Password provided is not strong enough.'
        };
    }
    return err;
}



function createUser(req, res, next) {
    var errs = [];
    var params = req.body;

    var requiredParams = [
        'login',
        'password',
        'email',
        'sn',
        'givenname',
        'cn',
        'phone',
        'company'
    ];

    for (var i in requiredParams)  {
        var field = requiredParams[i];
        if (!params[field]) {
            errs.push({
                field: field,
                code: 'Missing',
                message: 'This field is required'
            });
        }
    }

    if (errs.length > 0) {
        return next(new errors.InvalidParameterError("Error creating user", errs));
    }

    var user = {
        login: params.login,
        userpassword: params.password,
        email: params.email,
        cn: params.cn,
        givenname: params.givenname,
        sn: params.sn,
        company: params.company,
        phone: params.phone,
        approved_for_provisioning: (params.approved_for_provisioning || 'false'),
        registered_developer: (params.registered_developer || 'false')
    };

    if (req.body.groups) {
        if (typeof(req.body.groups) === 'string') {
            req.body.groups = [req.body.groups];
        }
    }

    return req.ufdsMaster.getUser(user.login, _getUserCallback);

    function _getUserCallback(err) {
        if (err && err.statusCode === 404) {
            return _doAddUser(user);
        } else {
            errs.push({
                field: 'login',
                code: 'Duplicate',
                message: 'Login name taken'
            });
            return next(new errors.InvalidParameterError("Error creating user", errs));
        }
    }

    function _doAddUser(userobj) {
        return req.ufdsMaster.addUser(userobj, function(err, u) {
            if (err) {
                req.log.fatal(err, "Error adding user");
                return next(new errors.InvalidParameterError("Error creating user", [translateUfdsError(err)]));
            } else {
                updateUserGroups(u, req.body.groups, function(err) {
                    if (err) {
                        req.log.fatal(err, 'Error adding user to group');
                        return next(new errors.InvalidParameterError("Error adding user to group", [translateUfdsError(err)]));
                    } else {
                        res.send(u);
                        return next();
                    }
                });
            }
        });
    }
}


function updateUserGroups(user, targetGroups, callback) {
    targetGroups = targetGroups || [];
    if (typeof(targetGroups) === 'string') {
        targetGroups = [targetGroups];
    }

    var currentGroups = user.groups();
    var operations = [];

    targetGroups.forEach(function(tg) {
        if (currentGroups.indexOf(tg) === -1) {
            operations.push(function(cb) {
                user.addToGroup(tg, cb);
            });
        }
    });

    currentGroups.forEach(function(cg) {
        if (targetGroups.indexOf(cg) === -1) {
            operations.push(function(cb) {
                user.removeFromGroup(cg, cb);
            });
        }
    });

    async.parallel(operations, function(err) {
        return callback(null);
    });
}


function getLimits(req, res, next) {
    req.ufdsMaster.listLimits(req.params.uuid, function(err, limits) {
        if (err) {
            req.log.fatal(err, 'Error retreiving limits for user %s', req.params.uuid);
            return next(err);
        }

        limits = limits.map(function(l) {
            delete l.dn;
            delete l.controls;
            delete l.objectclass;
            return l;
        });

        res.send(limits);
        return next();
    });
}

function addLimit(req, res, next) {
    var user = req.params.uuid;
    req.ufdsMaster.addLimit(user, req.body, function(err, limit) {
        if (err) {
            req.log.fatal(err, 'Error creating limit');
            return next(err);
        }
        res.send(limit);
        return next();
    });
}

function updateLimit(req, res, next) {
    var user = req.params.uuid;

    var params = req.body;
    params.datacenter = req.params.datacenter;

    req.ufdsMaster.updateLimit(user, params, function(err, limit) {
        if (err) {
            req.log.fatal(err, 'Error Updating limit');
            return next(err);
        }

        res.send(params);
        return next();
    });
}

function deleteLimit(req, res, next) {
    var user = req.params.uuid;
    var datacenter = req.params.datacenter;
    var limit = {
        datacenter: datacenter
    };

    req.ufdsMaster.deleteLimit(user, limit, function(err) {
        if (err) {
            req.log.fatal(err, 'Error deleting limits for datacenter %s', datacenter);
            return next(err);
        }

        return res.send({});
    });
}


function getTwoFactorAuthStatus(req, res, next) {
    req.ufdsMaster.getMetadata(req.params.uuid, 'portal', onRetrieveMetadata);

    function onRetrieveMetadata(err, data) {
        if (data && data.useMoreSecurity) {
            res.send({enabled: true});
        } else {
            res.send({enabled: false});
        }

        return next();
    }
}



function updateTwoFactorAuthStatus(req, res, next) {
    var user = null;
    req.ufdsMaster.getUser(req.params.uuid, onRetreiveUser);
    req.log.info('updateTwoFactorAuthStatus');

    function onRetreiveUser(err, u) {
        user = u;
        req.ufdsMaster.getMetadata(user, 'portal', onRetrieveMetadata);
    }

    function onRetrieveMetadata(err, data) {
        if (err.statusCode === 404 && req.body.enabled) {
            data = {};
            data.useMoreSecurity = true;

            req.log.info('addMetadata', user, 'portal', data);
            req.ufdsMaster.addMetadata(user, 'portal', data, function(e, m) {
                if (e) {
                    return next(e);
                }

                res.send({});
            });
        } else {
            delete data.useMoreSecurity;
            req.log.info('modifyMetadata', user, 'portal', data);
            req.ufdsMaster.modifyMetadata(user, 'portal', data, function(e, m) {
                if (e) {
                    return next(e);
                }

                res.send({});
            });
        }
    }
}
