var uuid = require('node-uuid').uuid;
var sprintf = require('util').format;
var errors = require('./errors');
var restify = require('restify');

var MORAY_UFDS_BUCKET = 'ufds_o_smartdc';

module.exports = {
    create: create,
    count: count,
    list: list,
    get: get,
    countUsers: countUsers,
    update: update,
    listKeys: listKeys,
    addKey: addKey,
    deleteKey: deleteKey
};


function get(req, res, next) {
    var login = req.params.login;
    req.sdc.ufds.getUser(login, function(err, user) {
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

    req.sdc.ufds.search('ou=users,o=smartdc', opts, function(err, users) {
        if (err) {
            return next(err);
        }

        res.send({
            count: users.length
        });
        return next();
    });
}

function list(req, res, next) {

    var filter = '(objectclass=sdcperson)';

    if (req.params.q) {
        var q = req.params.q;
        filter = filter + sprintf('(|(uuid=%s)(login=%s*)(email=%s))', q, q, q);
    }

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

    if (req.params.sn) {
        filter = filter + sprintf('(sn=%s*)', req.params.sn);
    }

    if (req.params.login) {
        filter = filter + sprintf('(login=%s*)', req.params.login);
    }


    filter = sprintf('(&%s)', filter);

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
    var mReq = req.sdc[req.dc].moray.findObjects(MORAY_UFDS_BUCKET, filter, opts);
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
    req.sdc.ufds.listKeys(req.params.uuid, function(err, keys) {
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
    req.sdc.ufdsMaster.deleteKey(user, fingerprint, function(err) {
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
        req.sdc.ufdsMaster.addKey(user, key, function(err, key) {
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

    req.sdc.ufds.search('ou=users, o=smartdc', opts, function(err, u) {
        res.send({
            count: u.length
        });
    });
}

function update(req, res, next) {
    var uuid = req.params.uuid;
    req.sdc.ufdsMaster.getUser(uuid, _getUserCallback);

    function _getUserCallback(err, user) {
        if (err) {
            req.log.fatal(err, 'Error retrieving user from UFDS');
            return next(err);
        }

        var changes = {};

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

        updateUserGroups(user, req.body.groups, function(err) {
            if (err) {
                req.log.fatal(err, 'Error moditifying user group membership');
                return next(new errors.InvalidParameterError("Error modifying user group membership",
                    [translateUfdsError(err)]
                    ));
            }
            req.sdc.ufdsMaster.updateUser(uuid, changes, _updateUserCallback);
        });
    }


    function _updateUserCallback(err) {
        if (err) {
            req.log.fatal(err, 'Error updating user from UFDS');
            return next(new errors.InvalidParameterError("Error creating user",
                [translateUfdsError(err)]
                ));
        }

        req.sdc.ufdsMaster.getUser(uuid, function(err, user) {
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

function create(req, res, next) {
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
        approved_for_provisioning: (params.approved_for_provisioning || 'false')
    };

    if (req.body.groups) {
        if (typeof(req.body.groups) === 'string') {
            req.body.groups = [req.body.groups];
        }
    }

    return req.sdc.ufdsMaster.getUser(user.login, _getUserCallback);

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
        return req.sdc.ufdsMaster.addUser(userobj, function(err, u) {
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

function updateUserGroups(user, groups, callback) {
    groups = groups || [];
    if (user.isAdmin() && groups.indexOf('operators') === -1) {
        return user.removeFromGroup('operators', callback);
    } else if (!user.isAdmin() && groups.indexOf('operators') !== -1) {
        return user.addToGroup('operators', callback);
    } else {
        return callback(null);
    }
}

