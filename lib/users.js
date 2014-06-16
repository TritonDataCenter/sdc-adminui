var sprintf = require('util').format;
var errors = require('./errors');
var restify = require('restify');
var crypto = require('crypto');
var async = require('async');
var _ = require('underscore');
var MORAY_UFDS_BUCKET = 'ufds_o_smartdc';

module.exports = {
    create: createUser,
    count: count,
    list: listUsers,
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
    var uuid = req.params.uuid;
    var account = req.params.account;
    req.ufdsMaster.getUser(uuid, account, function(err, user) {
        if (err) {
            return next(err);
        }
        user.emailhash = crypto.createHash('md5').update(user.email.toLowerCase()).digest("hex");
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

function caseIgnoreSubstringsMatch(f, q) {
    return sprintf('(%s:caseIgnoreSubstringsMatch:=*%s*)', f, q);
}

function listUsers(req, res, next) {

    var ldapquery = '';
    var filters = [];

    if (req.query.q) {
        var q = req.query.q;


        // if the query contains a space, then skip email and login query
        if (q.indexOf(' ') === -1) {
            filters.push(caseIgnoreSubstringsMatch('login', q));
            filters.push(caseIgnoreSubstringsMatch('email', q));
        }

        if (q.indexOf(' ') !== -1) {
            filters.push(caseIgnoreSubstringsMatch('cn', q));
        }

        if (q.length === 36) {
            filters.push(sprintf('(uuid=%s)', q));
        }

        filters.push(caseIgnoreSubstringsMatch('company', q));
        filters.push(caseIgnoreSubstringsMatch('givenname', q));
        filters.push(caseIgnoreSubstringsMatch('sn', q));

        ldapquery = sprintf('(&(objectclass=sdcperson)(|%s))', filters.join(''));

        req.log.info('Users filter query', ldapquery);
    } else {
        var filter = '(objectclass=sdcperson)';
        if (req.params.uuid) {
            filter = filter + sprintf('(uuid:caseIgnoreMatch:=%s)', req.params.uuid);
        }

        if (req.params.email) {
            filter = filter + sprintf('(email:caseIgnoreMatch:=%s*)', req.params.email);
        }

        if (req.params.cn) {
            filter = filter + sprintf('(cn:caseIgnoreMatch:=%s*)', req.params.cn);
        }

        if (req.params.givenname) {
            filter = filter + sprintf('(givenname:caseIgnoreMatch:=%s*)', req.params.givenname);
        }

        if (req.params.company) {
            filter = filter + sprintf('(company:caseIgnoreMatch:=%s*)', req.params.company);
        }

        if (req.params.sn) {
            filter = filter + sprintf('(sn:caseIgnoreMatch:=%s*)', req.params.sn);
        }

        if (req.params.login) {
            filter = filter + sprintf('(login:caseIgnoreMatch:=%s*)', req.params.login);
        }

        if (req.params.account) {
            filter = filter + sprintf('(account=%s)', req.params.account);
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
    var md5 = crypto.createHash('md5');

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

        entry.emailhash = crypto.createHash('md5').update(entry.email.toLowerCase()).digest("hex");

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


/**
 * ListKeys
 */
function listKeys(req, res, next) {
    req.ufdsMaster.listKeys(req.params.uuid, req.params.account, cb);

    function cb(err, keys) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(keys);
            return next();
        }
    }
}


function deleteKey(req, res, next) {
    var user = req.params.uuid;
    var account = req.params.account;

    var fingerprint = req.params.fingerprint;
    req.ufdsMaster.deleteKey(user, fingerprint, account, function(err) {
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
    var account = req.params.account;

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
        req.ufdsMaster.addKey(user, key, account, function(err, key) {
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

    if (params.account) {
        user.account = params.account;
    }

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

function isCapiLimit(limit) {
    return (_.without(Object.keys(limit), 'datacenter', 'limit', 'dn').length > 0);
}

function migrateLimit(ufds, limit, cb) {
    var oldEntries = _.without(Object.keys(limit), 'datacenter', 'limit', 'dn');
    var changes = [];
    oldEntries.forEach(function(attr) {
        var delEntry = {type: 'delete', modification : {}};
        delEntry.modification[attr] = [];
        changes.push(delEntry);

        var addValue = JSON.stringify({
            'check': 'image',
            'image': attr,
            'by': 'machines',
            'value': limit[attr]
        });

        var addEntry = { type: 'add', modification : {} };
        addEntry.modification['limit'] = addValue;
        changes.push(addEntry);
    });
    ufds.log.info('migration changes', limit.dn, changes);
    ufds.modify(limit.dn, changes, function(err, res) {
        if (err) {
            ufds.log.fatal(err);
            cb(err, res);
        } else {
            cb(null, res);
        }
    });
}


function getLimits(req, res, next) {
    async.waterfall(
        [
            function getLimits(cb) {
                req.ufdsMaster.listLimits(req.params.uuid, null, function(err, dclimits) {
                    if (err) {
                        req.log.fatal(err, 'Error retrieving dclimit for user %s', req.params.uuid);
                        return cb(err);
                    }
                    return cb(null, dclimits);
                }, true);
            },
            function migrateIfNeeded(dclimits, cb) {
                async.map(dclimits, function(dclimit, mapcb) {
                    delete dclimit.controls;
                    delete dclimit.objectclass;

                    if (isCapiLimit(dclimit)) {
                        req.log.info('found capi limit', dclimit);
                        migrateLimit(req.ufdsMaster, dclimit, function(err, migrateRes) {
                            mapcb(null, null);
                        });
                    } else {
                        mapcb(null, dclimit);
                    }
                }, function doneMigrateIfNeeded(err, res) {
                    if (err) {
                        req.log.fatal(err, 'error migrating limit');
                        cb(err);
                    } else {
                        req.log.info('migrationIfNeeded complete');

                        // check for migrated flag
                        if (res.indexOf(null) !== -1) {
                            req.log.info('did migration, fetching new limits');
                            cb(null, null);
                        } else {
                            cb(null, dclimits);
                        }
                    }
                });
                // end async.waterfall
            },
            function fetchNewLimitsIfNeeded(dclimits, cb) {
                if (dclimits) {
                    cb(null, dclimits);
                } else {
                    req.ufdsMaster.listLimits(req.params.uuid, null, function(err, dclimits) {
                        if (err) {
                            req.log.fatal(err, 'Error retrieving dclimits for user %s', req.params.uuid);
                            cb(err);
                        }
                        cb(null, dclimits);
                    }, true);
                }
            }
        ],
    function respondToRequest(err, dclimits) {
        dclimits = dclimits.map(function(l) {
            if (l.limit && typeof(l.limit) === 'string') {
                l.limit = [l.limit];
            }
            l.limit = l.limit || [];
            l.limit = l.limit.map(function(alimit) {
                try {
                    return JSON.parse(alimit);
                } catch (e) {
                    req.log.error('error parsing limit json', l.dn, alimit);
                    return {};
                }
            });
            return l;
        });
        dclimits.sort(function(a, b) {
            if (a.datacenter < b.datacenter) {
                return -1;
            }
            if (a.datacenter > b.datacenter) {
                return 1;
            }
            return 0;
        });

        res.send(dclimits);
        return next();
    });
}

function addLimit(req, res, next) {
    var user = req.params.uuid;
    delete req.body.datacenter;

    req.ufdsMaster.getLimit(user, req.params.datacenter, function(err, originalLimit) {
        delete req.body.limit.datacenter;
        var payload = {
            datacenter: req.params.datacenter,
            limit: JSON.stringify(req.body.limit)
        };

        if (err && err.name === 'ResourceNotFoundError') {
            req.ufdsMaster.addLimit(user, payload, function(err, limit) {
                if (err) {
                    req.log.fatal(err, 'Error creating limit');
                    return next(err);
                }
                res.send(limit);
                return next();
            });
        } else {
            var changes = [];

            var change = { type: 'add', modification: {} };
            change.modification['limit'] = payload.limit;
            changes.push(change);

            req.ufdsMaster.modify(originalLimit.dn, changes, function(limit) {
                if (err) {
                    req.log.fatal(err, 'Error creating limit');
                    return next(err);
                }
                return res.send({});
            });
        }
    });
}


function updateLimit(req, res, next) {
    var user = req.params.uuid;
    var datacenter = req.params.datacenter;


    var newLimit = req.body.limit;
    delete newLimit.datacenter;
    var originalLimit = req.body.original;


    req.ufdsMaster.listLimits(req.params.uuid, null, function(err, dclimits) {
        if (err) {
            req.log.fatal(err, 'Error retrieving dclimit for user %s', req.params.uuid);
            return next(err);
        }
        var capilimit = _.findWhere(dclimits, {datacenter: datacenter});
        var limitEnties = _.isArray(capilimit.limit) ? capilimit.limit : [capilimit.limit];
        var limitToDel = _.find(limitEnties, function(lstr) {
            var limit = JSON.parse(lstr);
            return (originalLimit.check === limit.check &&
                originalLimit[originalLimit.check] === limit[limit.check] &&
                originalLimit.by === limit.by &&
                originalLimit.value === limit.value);
        });
        req.log.info(limitToDel, "updating this limit to: ", newLimit);
        performChange(limitToDel, newLimit);
    });

    function performChange(limitToDel, newLimit) {
        var changes = [];
        var delOperation = {
            type: 'delete',
            modification: {
                limit: limitToDel
            }
        };
        var addOperation = {
            type: 'add',
            modification: {
                limit: JSON.stringify(newLimit)
            }
        };

        changes.push(delOperation);
        changes.push(addOperation);

        var dn = sprintf('dclimit=%s, uuid=%s, ou=users, o=smartdc', datacenter, user);
        req.log.info('limit update', dn, changes);

        req.ufdsMaster.modify(dn, changes, function(err, limit) {
            if (err) {
                req.log.fatal(err, 'Error Updating limit');
                return next(err);
            }

            res.send(limit);
            return next();
        });
    }
}

function deleteLimit(req, res, next) {
    var user = req.params.uuid;
    var datacenter = req.params.datacenter;

    var dn = sprintf('dclimit=%s, uuid=%s, ou=users, o=smartdc', datacenter, user);

    var limit = req.query;
    var changes = [];
    changes.push({
        type: 'delete',
        modification: {
            'limit': JSON.stringify(limit)
        }
    });

    // This is to ensure the limit gets even if there is a datacenter property.
    delete limit.datacenter;
    changes.push({
        type: 'delete',
        modification: {
            'limit': JSON.stringify(limit)
        }
    });

    req.log.info('delete limit request', dn, changes);
    req.ufdsMaster.modify(dn, changes, function(err) {
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
        req.log.info(data, 'getTwoFactorAuthStatus onRetrieveMetadata');

        if (data && data.usemoresecurity === 'true') {
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
        req.log.info('onRetrieveMetadata', err, data);

        if (err && err.statusCode === 404 && req.body.enabled) {
            data = {};
            data.usemoresecurity = true;

            req.log.info('addMetadata', user.dn, 'portal', data);
            req.ufdsMaster.addMetadata(user, 'portal', data, function(e, m) {
                if (e) {
                    return next(e);
                }

                res.send({enabled: true});
            });
        } else {
            delete data.usemoresecurity;
            req.log.info({uuid: user.uuid}, 'updateUserMetadata: portal', data);

            req.ufdsMaster.modifyMetadata(user, 'portal', data, function(e, r) {
                if (e) {
                    return next(e);
                }
                req.log.info(r,'FinishedUpdateUserMetadata: portal');

                res.send({enabled: false});
            });
        }
    }
}
