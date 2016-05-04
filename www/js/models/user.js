/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";
/**
 * models/user
 */

var _ = require('underscore');
var Model = require('./model');
var api = require('../request');


var User = module.exports = Model.extend({
    url: function() {
        if (this.get('uuid') && this.get('account')) {
            return _.str.sprintf('/api/users/%s/%s', this.get('account'), this.get('uuid'));
        }
        if (this.get('uuid')) {
            return _.str.sprintf('/api/users/%s', this.get('uuid'));
        }
        return _.str.sprintf('/api/users');
    },
    urlRoot: '/api/users',
    idAttribute: 'uuid',
    parse: function(resp) {
        var data = Model.prototype.parse.apply(this, arguments);
        data.groups = this.parseGroups(data.memberof);
        return data;
    },

    parseGroups: function(memberof) {
        return _.map(memberof, function(dn) {
            var p = dn.match(/^cn=(\w+)/);
            return p[1];
        });
    },

    authenticated: function() {
        return window.localStorage.getItem('api-token') !== null;
    },

    getToken: function() {
        return window.localStorage.getItem('api-token');
    },

    getAdminUuid: function() {
        return window.localStorage.getItem('admin-uuid');
    },

    role: function(r) {
        return this.getRoles().indexOf(r) >= 0;
    },

    getRoles: function() {
        var roles = window.localStorage.getItem('user-roles');
        return JSON.parse(roles);
    },

    getManta: function() {
        var m = window.localStorage.getItem('manta');
        if (m === "true") {
            return true;
        } else {
            return false;
        }
    },

    getDatacenter: function() {
        return window.localStorage.getItem('dc');
    },

    authenticate: function(user, pass) {
        var self = this;

        if (user.length === 0 || pass.length === 0) {
            this.trigger('error', 'Username and Password Required');
            return false;
        }

        var authData = {
            username: user,
            password: pass
        };

        var req = api.post("/api/auth");
        req.timeout(10000);
        req.send(authData);
        req.end(function(err, res) {
            if (err) {
                console.log('auth error', err);
                if (err.timeout) {
                    self.trigger('error', 'Server Error (request timeout)');
                }
                return;
            }

            if (res.ok) {
                var data = res.body;
                self.set(data.user);
                window.localStorage.setItem('api-token', data.token);
                window.localStorage.setItem('dc', data.dc);
                window.localStorage.setItem('admin-uuid', data.adminUuid);
                window.localStorage.setItem('manta', data.manta);

                window.localStorage.setItem('user-roles', JSON.stringify(data.roles));
                window.localStorage.setItem('user-uuid', data.user.uuid);
                window.localStorage.setItem('user-login', data.user.login);

                self.trigger('authenticated', {
                    user: self,
                    adminUuid: data.adminUuid,
                    manta: data.manta,
                    dc: data.dc
                });
            } else {
                self.trigger('error', res.body.message);
            }
        });
    },

    signout: function() {
        var self = this;
        api.del('/api/auth').end(function(res) {
            if (res.ok) {
                window.localStorage.removeItem('api-token');
                window.localStorage.removeItem('user-roles');
                window.localStorage.removeItem('manta');
                self.trigger('unauthenticated');
            } else {
                self.trigger('error', res.body);
            }
        });
    },

    validation: {
        login: {
            required: true,
            minLength: 3,
            maxLength: 32,
            pattern: {
                regex: /^[A-Za-z]+[A-Za-z0-9\.\_\@]*$/,
                msg: "Must start with a letter, and may contain letters, numbers, '@', '.' and '_'."
            }

        },
        password: {
            required: true,
            minLength: 7
        },
        email: {
            required: true
        },
        sn: {
            required: true
        },
        givenname: {
            required: true
        },
        phone: {
            required: true
        },
        company: {
            required: true
        }
    }
});

User.currentUser = function() {
    var roles = [];
    try {
        roles = JSON.parse(window.localStorage.getItem('user-roles'));
    } catch (e) {
        roles = [];
    }
    return new User({
        'token': window.localStorage.getItem('api-token') || null,
        'uuid': window.localStorage.getItem('user-uuid') || null,
        'login': window.localStorage.getItem('user-login') || null,
        'adminUuid': window.localStorage.getItem('admin-uuid') || null,
        'manta': window.localStorage.getItem('manta') || false,
        'roles': roles
    });
};
