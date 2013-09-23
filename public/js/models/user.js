/**
 * models/user
 */

var Backbone = require('backbone');
var _ = require('underscore');
var Model = require('./model');


var User = module.exports = Model.extend({
    urlRoot: '/_/users',
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

    getRoles: function() {
        var roles = window.localStorage.getItem('user-roles');
        return JSON.parse(roles);
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

        $.post("/_/auth", authData, function(data) {
            self.set(data.user);
            window.localStorage.setItem('api-token', data.token);
            window.localStorage.setItem('dc', data.dc);
            window.localStorage.setItem('admin-uuid', data.adminUuid);

            window.localStorage.setItem('user-roles', JSON.stringify(data.roles));
            window.localStorage.setItem('user-uuid', data.user.uuid);
            window.localStorage.setItem('user-login', data.user.login);

            self.trigger('authenticated', {
                user: self,
                adminUuid: data.adminUuid,
                dc: data.dc
            });
        }).error(function(xhr) {
            var err = JSON.parse(xhr.responseText);
            self.trigger('error', err.message);
        });
    },

    signout: function() {
        window.localStorage.removeItem('api-token');
        window.localStorage.removeItem('user-roles');
        this.trigger('unauthenticated');
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
        'roles': roles
    });
};
