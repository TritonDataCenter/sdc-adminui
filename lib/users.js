var uuid = require('node-uuid').uuid;
var sprintf = require('util').format;
var errors = require('./errors');
var restify = require('restify');

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
        if (err) return next(err);

        res.send(user);
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
    });
}

function list(req, res, next) {
    var opts = {
        scope: 'one',
        attributes: ['*']
    };
    var filter = '(objectclass=sdcperson)';


    if (req.params.uuid) {
        filter = filter + sprintf('(uuid=%s)', req.params.uuid);
    }

    if (req.params.email) {
        filter = filter + sprintf('(email=*%s*)', req.params.email);
    }

    if (req.params.cn) {
        filter = filter + sprintf('(cn=*%s*)', req.params.cn);
    }

    if (req.params.givenName) {
        filter = filter + sprintf('(givenName=*%s*)', req.params.givenName);
    }

    if (req.params.sn) {
        filter = filter + sprintf('(sn=*%s*)', req.params.sn);
    }

    if (req.params.login) {
        filter = filter + sprintf('(login=*%s*)', req.params.login);
    }


    opts.filter = sprintf('(&%s)', filter);
    req.log.info(opts.filter);

    req.sdc.ufds.search('ou=users,o=smartdc', opts, function(err, users) {
        if (err) {
            return next(err);
        }

        res.send(users);
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
    req.sdc.ufds.deleteKey(user, fingerprint, function(err) {
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
    var key = req.body.key;

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
        req.sdc.ufds.addKey(user, key, function(err, key) {
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
    req.sdc.ufds.getUser(uuid, _getUserCallback);

    function _getUserCallback(err, user) {
        if (err) {
            req.log.fatal(err, 'Error retrieving user from UFDS');
            return next(err);
        } else {
            var changes = {};
            if (req.body.cn) {
                changes['cn'] = req.body.cn;
            }

            if (req.body.givenName) {
                changes['givenName'] = req.body.cn;
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

            req.sdc.ufds.updateUser(uuid, changes, _updateUserCallback);
        }
    }

    function _updateUserCallback(err, user) {
        if (err) {
            req.log.fatal(err, 'Error updating user from UFDS');
            var errs = [];
            if (err.message === 'passwordInHistory') {
                errs.push({
                    code: 'Invalid',
                    field: 'password',
                    message: 'Password was used previously.'
                });
            } else {
                errs.push(err);
            }
            return next(new errors.InvalidParameterError("Error creating user", errs));
        }

        res.send(user);
        return next();
    }
}

function create(req, res, next) {
    var errs = [];
    var params = req.body;

    var requiredParams = [
        'login',
        'password',
        'email',
        'sn',
        'givenName',
        'cn',
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
        givenName: params.givenName,
        sn: params.sn,
        company: params.company,
        phone: params.phone
    };

    return req.sdc.ufds.getUser(user.login, _getUserCallback);

    function _getUserCallback(err) {
        req.log.info('hello', err);
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
        return req.sdc.ufds.addUser(userobj, function(err, u) {
            if (err) {
                res.send(err);
            } else {
                res.send(u);
            }
            return next();
        });
    }
}
