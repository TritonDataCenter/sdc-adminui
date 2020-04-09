/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright 2020 Joyent, Inc.
 */

/* eslint-disable max-len */

var sprintf = require('util').format;
var restify = require('restify');
var errors = require('./errors');
var crypto = require('crypto');
var Promise = require('promise');
var vasync = require('vasync');
var _ = require('underscore');
var MORAY_UFDS_BUCKET = 'ufds_o_smartdc';

module.exports = {
    create: createUser,
    count: countUsers,
    list: listUsers,
    get: getUser,
    countUsers: countUsers,
    update: update,
    deleteUser: deleteUser,

    listSubuserRoles: listSubuserRoles,

    listKeys: listKeys,
    addKey: addKey,
    deleteKey: deleteKey,

    getLimits: getLimits,
    addLimit: addLimit,
    deleteLimit: deleteLimit,
    updateLimit: updateLimit,
    unlockUser: unlockUser,

    getTwoFactorAuthStatus: getTwoFactorAuthStatus,
    disableTwoFactorAuth: disableTwoFactorAuth,

    getPolicy: getPolicy,
    listPolicies: listPolicies,
    addPolicy: addPolicy,
    modifyPolicy: modifyPolicy,
    deletePolicy: deletePolicy,

    listRoles: listRoles,
    addRole: addRole,
    modifyRole: modifyRole,
    deleteRole: deleteRole
};


function getUser(req, res, next) {
    var uuid = req.params.uuid;
    var account = req.params.account;
    req.ufds.getUser(uuid, account, function (err, user) {
        if (err) {
            return next(err);
        }
        var loginData = user.login.split('/');
        if (user.account && user.account === loginData[0]) {
            user.alias = loginData[1];
        }
        user.emailhash = crypto.createHash('md5').update(user.email.toLowerCase()).digest('hex');
        res.send(user);
        return next();
    });
}


function caseIgnoreSubstringsMatch(f, q) {
    return sprintf('(%s:caseIgnoreSubstringsMatch:=*%s*)', f, q);
}

function listSubuserRoles(req, res, next) {
    req.ufds.getUser(req.params.uuid, req.params.account, function (err, u) {
        if (err) {
            return next(err);
        }

        u.roles(function (getRolesErr, roles) {
            if (getRolesErr) {
                return next(getRolesErr);
            }

            res.send(roles);
            return next();
        });

        return null;
    });

    return null;
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

        if (req.query.accountsonly) {
            ldapquery = sprintf('(&(objectclass=sdcperson)(!(objectclass=sdcaccountuser))(|%s))', filters.join(''));
        } else {
            ldapquery = sprintf('(&(objectclass=sdcperson)(|%s))', filters.join(''));
        }

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

    mReq.once('error', function (err) {
        req.log.fatal(err, 'UFDS error when searching for users');
        return next(err);
    });

    mReq.on('record', function (obj) {
        var entry = {};
        count = obj._count;
        var keys = Object.keys(obj.value);

        keys.forEach(function (k) {
            if (k.slice(0, 1) !== '_' && obj.value.hasOwnProperty(k)) {
                entry[k] = obj.value[k][0];
            }
        });

        if (entry.email) {
            entry.emailhash = crypto.createHash('md5').update(entry.email.toLowerCase()).digest('hex');
        }

        entries.push(entry);
    });

    mReq.on('end', function () {
        if (count) {
            res.setHeader('x-object-count', count.toString());
        }
        res.send(entries);
        return next();
    });

    return null;
}


/**
 * ListKeys
 */
function listKeys(req, res, next) {
    req.ufds.listKeys(req.params.uuid, req.params.account, cb);

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
    req.ufds.deleteKey(user, fingerprint, account, function (err) {
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
        var error = new errors.ValidationFailedError(err.message, [ {
            field: 'key',
            code: 'Invalid' }]);

        return next(error);
    }

    try {
        req.ufds.addKey(user, key, account, function (err, addedKey) {
            if (err) {
                return _onError(err);
            } else {
                res.send(addedKey);
                return next();
            }
        });
    } catch (e) {
        _onError(e);
    }

    return null;
}


function countUsers(req, res, next) {
    var opts = {
        scope: 'one',
        attributes: ['*', 'memberof'],
        filter: '(objectclass=sdcperson)'
    };

    req.ufds.search('ou=users, o=smartdc', opts, function (userCountErr, u) {
        if (userCountErr) {
            req.log.fatal(userCountErr, 'error retrieving user count');
            return next(userCountErr);
        }

        res.send({ count: u.length });
        return next();
    });
    return null;
}

function update(req, res, next) {
    var uuid = req.params.uuid;
    var account = req.params.account;

    req.ufds.getUser(uuid, account, _getUserCallback);

    function _getUserCallback(getUserErr, user) {
        if (getUserErr) {
            req.log.fatal(getUserErr, 'Error retrieving user from UFDS');
            return next(getUserErr);
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

        if (req.body.cn) {
            changes['cn'] = req.body.givenname + ' ' + req.body.sn;
        }

        if (req.body.password) {
            changes['userpassword'] = req.body.password;
        }

        if (req.body.email) {
            changes['email'] = req.body.email;
        }
        changes['approved_for_provisioning'] = req.body.approved_for_provisioning || 'false';
        changes['registered_developer'] = req.body.registered_developer || 'false';
        changes['triton_cns_enabled'] = req.body.triton_cns_enabled || 'false';

        changes['tenant'] = req.body.tenant;
        changes['company'] = req.body.company;
        changes['phone'] = req.body.phone;


        updateUserGroups(user, req.body.groups, function (err) {
            if (err) {
                req.log.fatal(err, 'Error moditifying user group membership');
                return next(new errors.InvalidParameterError('Error modifying user group membership',
                    [translateUfdsError(err)]));
            }

            return req.ufds.updateUser(uuid, changes, account, _updateUserCallback);
        });

        return null;
    }


    function _updateUserCallback(updateUserErr) {
        if (updateUserErr) {
            req.log.fatal(updateUserErr, 'Error updating user from UFDS');
            return next(new errors.InvalidParameterError('Error creating user',
                [translateUfdsError(updateUserErr)]));
        }

        req.ufds.getUser(uuid, account, function (getUserErr, user) {
            if (getUserErr) {
                req.log.fatal(getUserErr, 'Error retrieving updated user', uuid);
                return next(getUserErr);
            }

            res.send(user);
            return next();
        });

        return null;
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

    var user = {
        login: params.login,
        userpassword: params.password,
        email: params.email,
        cn: params.givenname + ' ' + params.sn,
        givenname: params.givenname,
        sn: params.sn,
        company: params.company,
        phone: params.phone,
        tenant: params.tenant || '',
        approved_for_provisioning: params.approved_for_provisioning || 'false',
        registered_developer: params.registered_developer || 'false',
        triton_cns_enabled: params.triton_cns_enabled || 'false'
    };

    if (params.account) {
        user.account = params.account;
    }

    if (req.body.groups) {
        if (typeof (req.body.groups) === 'string') {
            req.body.groups = [req.body.groups];
        }
    }

    return req.ufds.getUser(user.login, _getUserCallback);

    function _getUserCallback(err) {
        if (err && err.statusCode === 404) {
            return _doAddUser(user);
        } else {
            errs.push({
                field: 'login',
                code: 'Duplicate',
                message: 'Login name taken'
            });
            return next(new errors.InvalidParameterError('Error creating user', errs));
        }
    }

    function _doAddUser(userobj) {
        return req.ufds.addUser(userobj, function (addUserError, u) {
            if (addUserError) {
                req.log.fatal(addUserError, 'Error adding user');
                return next(new errors.InvalidParameterError('Error creating user',
                    [translateUfdsError(addUserError)]));
            } else {
                return updateUserGroups(u, req.body.groups, function (updateUserGroupsError) {
                    if (updateUserGroupsError) {
                        req.log.fatal(updateUserGroupsError, 'Error adding user to group');
                        return next(new errors.InvalidParameterError('Error adding user to group',
                            [translateUfdsError(updateUserGroupsError)]));
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
    if (typeof (targetGroups) === 'string') {
        targetGroups = [targetGroups];
    }

    var currentGroups = user.groups();
    var operations = [];

    targetGroups.forEach(function (tg) {
        if (currentGroups.indexOf(tg) === -1) {
            operations.push(function (cb) {
                user.addToGroup(tg, cb);
            });
        }
    });

    currentGroups.forEach(function (cg) {
        if (targetGroups.indexOf(cg) === -1) {
            operations.push(function (cb) {
                user.removeFromGroup(cg, cb);
            });
        }
    });

    vasync.parallel({funcs: operations}, callback);
}

function isCapiLimit(limit) {
    return (_.without(Object.keys(limit), 'datacenter', 'limit', 'dn').length > 0);
}

function migrateLimit(ufds, limit, cb) {
    var oldEntries = _.without(Object.keys(limit), 'datacenter', 'limit', 'dn');
    var changes = [];
    oldEntries.forEach(function (attr) {
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
    ufds.modify(limit.dn, changes, function (err, res) {
        if (err) {
            ufds.log.fatal(err);
            cb(err, res);
        } else {
            cb(null, res);
        }
    });
}


function getLimits(req, res, next) {
    vasync.waterfall([
        function doGetLimits(cb) {
            req.ufds.listLimits(req.params.uuid, null, function (err, dclimits) {
                if (err) {
                    req.log.fatal(err, 'Error retrieving dclimit for user %s', req.params.uuid);
                    cb(err);
                    return;
                }
                cb(null, dclimits);
            }, true);
        },
        function migrateIfNeeded(dclimits, cb) {
            var migratedResults = [];
            vasync.forEachParallel({
                inputs: dclimits,
                func: function checkLimit(dclimit, mapcb) {
                    delete dclimit.controls;
                    delete dclimit.objectclass;

                    if (isCapiLimit(dclimit)) {
                        req.log.info('found capi limit', dclimit);
                        migrateLimit(req.ufds, dclimit, function (err, migrateRes) {
                            migratedResults.push(null);
                            mapcb(err);
                        });
                    } else {
                        migratedResults.push(dclimit);
                        mapcb(null);
                    }
                }
            }, function doneMigrateIfNeeded(migrateErr) {
                if (migrateErr) {
                    req.log.fatal(migrateErr, 'error migrating limit');
                    cb(migrateErr);
                    return;
                } else {
                    req.log.info('migrationIfNeeded complete');

                    // check for migrated flag
                    if (migratedResults.indexOf(null) !== -1) {
                        req.log.info('did migration, fetching new limits');
                        cb(null, null);
                    } else {
                        cb(null, dclimits);
                    }
                }
            });
        },
        function fetchNewLimitsIfNeeded(dclimits, cb) {
            if (dclimits) {
                cb(null, dclimits);
            } else {
                req.ufds.listLimits(req.params.uuid, null, function (listErr, listLimitsRes) {
                    if (listErr) {
                        req.log.fatal(listErr, 'Error retrieving listLimitsRes for user %s', req.params.uuid);
                        cb(listErr);
                        return;
                    }
                    cb(null, listLimitsRes);
                }, true);
            }
        }
    ], function respondToRequest(err, dclimits) {
        dclimits = dclimits.map(function (l) {
            if (l.limit && typeof (l.limit) === 'string') {
                l.limit = [l.limit];
            }
            l.limit = l.limit || [];
            l.limit = l.limit.map(function (alimit) {
                try {
                    return JSON.parse(alimit);
                } catch (e) {
                    req.log.error('error parsing limit json', l.dn, alimit);
                    return {};
                }
            });
            return l;
        });
        dclimits.sort(function (a, b) {
            if (a.datacenter < b.datacenter) {
                return -1;
            }
            if (a.datacenter > b.datacenter) {
                return 1;
            }
            return 0;
        });

        res.send(dclimits);
        next();
    });
}

function addLimit(req, res, next) {
    var user = req.params.uuid;
    delete req.body.datacenter;

    req.ufds.getLimit(user, req.params.datacenter, function (err, originalLimit) {
        delete req.body.limit.datacenter;
        var payload = {
            datacenter: req.params.datacenter,
            limit: JSON.stringify(req.body.limit)
        };

        if (err && err.name === 'ResourceNotFoundError') {
            req.ufds.addLimit(user, payload, function (addLimitErr, limit) {
                if (addLimitErr) {
                    req.log.fatal(addLimitErr, 'Error creating limit');
                    return next(addLimitErr);
                }
                res.send(limit);
                return next();
            });
        } else {
            var changes = [];

            var change = { type: 'add', modification: {} };
            change.modification['limit'] = payload.limit;
            changes.push(change);

            req.ufds.modify(originalLimit.dn, changes, function (limit) {
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


    return req.ufds.listLimits(req.params.uuid, null, function (err, dclimits) {
        if (err) {
            req.log.fatal(err, 'Error retrieving dclimit for user %s', req.params.uuid);
            return next(err);
        }
        var capilimit = _.findWhere(dclimits, {datacenter: datacenter});
        var limitEnties = _.isArray(capilimit.limit) ? capilimit.limit : [capilimit.limit];
        var limitToDel = _.find(limitEnties, function (lstr) {
            var limit = JSON.parse(lstr);
            return (originalLimit.check === limit.check &&
                originalLimit[originalLimit.check] === limit[limit.check] &&
                originalLimit.by === limit.by &&
                originalLimit.value === limit.value);
        });
        req.log.info(limitToDel, 'updating this limit to: ', newLimit);
        return performChange(limitToDel, newLimit);
    });

    function performChange(limitToDel, limitToAdd) {
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
                limit: JSON.stringify(limitToAdd)
            }
        };

        changes.push(delOperation);
        changes.push(addOperation);

        var dn = sprintf('dclimit=%s, uuid=%s, ou=users, o=smartdc', datacenter, user);
        req.log.info('limit update', dn, changes);

        req.ufds.modify(dn, changes, function (err, limit) {
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
    req.ufds.modify(dn, changes, function (err) {
        if (err) {
            req.log.fatal(err, 'Error deleting limits for datacenter %s', datacenter);
            return next(err);
        }
        return res.send({});
    });
}


function getTwoFactorAuthStatus(req, res, next) {
    req.ufds.getMetadata(req.params.uuid, 'portal', onRetrieveMetadata, true);

    function onRetrieveMetadata(err, data) {
        req.log.info(data, 'getTwoFactorAuthStatus onRetrieveMetadata');

        if (data && data.usemoresecurity) {
            res.send({enabled: true});
        } else {
            res.send({enabled: false});
        }

        return next();
    }
}



function disableTwoFactorAuth(req, res, next) {
    var user = null;
    req.ufds.getUser(req.params.uuid, onRetreiveUser);
    req.log.info('disableTwoFactorAuth');

    function onRetreiveUser(err, u) {
        user = u;
        req.ufds.getMetadata(user, 'portal', onRetrieveMetadata, true);
    }

    function onRetrieveMetadata(err, data) {
        req.log.info('onRetrieveMetadata', err, data);

        if (err && err.statusCode === 404 && req.body.enabled) {
            res.send({enabled: false});
            return next();
        } else {
            data.usemoresecurity = null;

            req.log.info({uuid: user.uuid, data: data }, 'updateUserMetadata: portal');

            req.ufds.modifyMetadata(user, 'portal', data, function (e, r) {
                if (e) {
                    return next(e);
                }
                req.log.info(r, 'FinishedUpdateUserMetadata: portal');
                res.send({enabled: false});
                return next();
            });
        }

        return null;
    }
}


function translatePolicy(p) {
    if (typeof (p.rule) === 'string')  {
        p.rules = [p.rule];
    } else {
        p.rules = p.rule;
    }
    delete p.rule;
    return p;
}

/**
 * GetPolicy
 */
function getPolicy(req, res, next) {
    req.ufds.getPolicy(req.params.uuid, req.params.policy, function (err, p) {
        if (err) {
            req.log.error(err, 'Error retrieving policy ', req.params.uuid, req.params.policy);
            return next(err);
        }

        res.send(translatePolicy(p));
        return next();
    });
}


/**
 * ListPolicies
 */
function listPolicies(req, res, next) {
    req.ufds.listPolicies(req.params.uuid, function (err, policies) {
        if (err) {
            return next(err);
        }
        policies = policies.map(translatePolicy);
        res.send(policies);
        return next();
    });
}


/**
 * AddPolicy
 */
function addPolicy(req, res, next) {
    var policy = req.body;
    policy.account = req.params.uuid;

    if (req.body.rules) {
        req.body.rule = req.body.rules;
        delete req.body.rules;
    }

    req.log.info(req.body, 'addPolidy for ', req.params.uuid);
    req.ufds.addPolicy(req.params.uuid, policy, function (addPolicyErr, addedPolicy) {
        if (addPolicyErr) {
            return next(addPolicyErr);
        }
        res.send(addedPolicy);
        return next();
    });

    return null;
}

/**
 * DeletePolicy
 */
function deletePolicy(req, res, next) {
    var policy = req.params.policy;
    var account = req.params.uuid;

    req.log.info('removePolicy ', policy, 'for account', account);
    return req.ufds.deletePolicy(account, policy, function (deletePolicyErr, deletedPolicy) {
        if (deletePolicyErr) {
            return next(deletePolicyErr);
        }
        res.send(deletedPolicy);
        return next();
    });

}



/**
 * ModifyPolicy
 */
function modifyPolicy(req, res, next) {
    var policy = req.body;
    policy.account = req.params.uuid;

    if (req.body.rules) {
        req.body.rule = req.body.rules;
        delete req.body.rules;
    }

    req.log.info(req.body, 'modifyPolicy for ', req.params.uuid);
    return req.ufds.modifyPolicy(req.params.uuid,
       req.params.policy,
       policy,
       function (modifyPolicyErr, modifiedPolicy) {
        if (modifyPolicyErr) {
            return next(modifyPolicyErr);
        }
        res.send(modifiedPolicy);
        return next();
    });
}


function _translateRole(r) {
    if (r.memberpolicy) {
        if (typeof (r.memberpolicy) === 'string') {
            r.policies = [r.memberpolicy];
        } else {
            r.policies = r.memberpolicy;
        }
    } else {
        r.policies = [];
    }
    if (r.uniquemember) {
        if (typeof (r.uniquemember) === 'string') {
            r.members = [r.uniquemember];
        } else {
            r.members = r.uniquemember;
        }
    } else {
        r.members = [];
    }
    return r;
}

/**
 * ListGroups
 */
function listRoles(req, res, next) {
    req.ufds.listRoles(req.params.uuid, function (err, result) {
        if (err) {
            next(err);
            return;
        }

        var roles = [];
        var membersCache = {};
        vasync.forEachParallel({
            inputs: result.map(_translateRole),
            func: function (role, callback) {
                var members = [];
                vasync.forEachParallel({
                    inputs: role.members,
                    func: function (member, cb) {
                        var memberExists = true;
                        var done = function () {
                            if (memberExists) {
                                members.push(member);
                            }
                            cb();
                            return;
                        };
                        if (membersCache.hasOwnProperty(member)) {
                            memberExists = membersCache[member];
                            done();
                            return;
                        }
                        /* JSSTYLED */
                        var uuids = member.match(/uuid=([a-z0-9-]+), uuid=([a-z0-9-]+)/);
                        req.ufds.getUser(uuids[1], uuids[2], function (error) {
                            if (error) {
                                if (error.body && error.body.code === 'ResourceNotFound') {
                                    memberExists = false;
                                } else {
                                    cb(error);
                                    return;
                                }
                            }
                            membersCache[member] = memberExists;
                            done();
                        });
                    }
                }, function (error) {
                    if (error) {
                        callback(error);
                        return;
                    }

                    role.members = members;
                    roles.push(role);
                    callback();
                });
            }
        }, function (error) {
            if (error) {
                next(error);
                return;
            }
            res.send(roles);
            next();
        });
    });
}




/**
 * AddRole
 */
function addRole(req, res, next) {
    var account = req.params.uuid;
    var role = {};
    role.name = req.body.name;
    role.account = account;
    role.memberpolicy = req.body.policies.map(function (p) {
        return sprintf('policy-uuid=%s, uuid=%s, ou=users, o=smartdc', p, account);
    });
    role.uniquemember = req.body.members.map(function (m) {
        return sprintf('uuid=%s, uuid=%s, ou=users, o=smartdc', m, account);
    });

    return req.ufds.addRole(account, role, function (err, addedRole) {
        if (err) {
            req.log.error(err, 'Error Adding Role');
            return next(err);
        } else {
            req.log.info('saved role', role, 'output', addedRole);
            res.send(_translateRole(addedRole));
            return next();
        }
    });
}

/**
 * modifyRole
 */
function modifyRole(req, res, next) {
    var account = req.params.uuid;
    var role = {};
    if (req.body.uuid) {
        role.uuid = req.body.uuid;
    }
    role.name = req.body.name;
    role.account = account;
    role.memberpolicy = req.body.policies.map(function (p) {
        return sprintf('policy-uuid=%s, uuid=%s, ou=users, o=smartdc', p, account);
    });
    role.uniquemember = req.body.members.map(function (m) {
        return sprintf('uuid=%s, uuid=%s, ou=users, o=smartdc', m, account);
    });

    return req.ufds.modifyRole(account, role.uuid, role, function (modifyRoleErr, modifiedRole) {
        if (modifyRoleErr) {
            req.log.error(modifyRoleErr, 'Error Adding Role');
            return next(modifyRoleErr);
        } else {
            req.log.info('saved role', role, 'output', modifiedRole);
            res.send(_translateRole(modifiedRole));
            return next();
        }
    });
}


/**
 * deleteRole
 */
function deleteRole(req, res, next) {
    var role = req.params.role;
    var account = req.params.uuid;

    req.log.info('deleteRole ', role, 'for account', account);
    req.ufds.deleteRole(account, role, function (err, r) {
        if (err) {
            return next(err);
        }
        res.send(r);
        return next();
    });
}


function unlockUser(req, res, next) {
    req.ufds.getUser(req.params.uuid, function (err, user) {
        user.unlock(function (unlockErr, unlockRes) {
            if (unlockErr) {
                return next(unlockErr);
            }
            res.send(unlockRes);
            return next();
        });
    });
}


function deleteUser(req, res, next) {
    var user = req.params.uuid;
    var account = req.params.account;

    if (!account) {
        _deleteUser();
        return;
    }

    _listKeys()
        .then(_deleteAllKeys)
        .then(_deleteUser)
        .then(done)
        .catch(fail);

    function done() {
        res.send({});
        next();
    }

    function fail(err) {
        next(restify.ConflictError(err));
    }

    function _deleteAllKeys(keys) {
        return Promise.all(keys.map(_deleteKey));
    }

    function _deleteKey(key) {
        return new Promise(function (resolve, reject) {
            req.log.info('deleting key', key.dn);
            req.ufds.del(key.dn, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(key);
                }
            });
        });
    }

    function _listKeys() {
        return new Promise(function (resolve, reject) {
            req.ufds.listKeys(user, account, function (err, keys) {
                if (err) {
                    reject('Error retrieving user\'s keys for deletion for user deletion');
                } else {
                    resolve(keys);
                }
            });
        });
    }

    function _deleteUser() {
        return new Promise(function (resolve, reject) {
            req.ufds.deleteUser(req.params.uuid, req.params.account, function (err, u) {
                req.log.info('deleted user', req.params.uuid);

                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }
}
