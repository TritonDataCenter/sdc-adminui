/**
 * models/user
 */

var Backbone = require('backbone');
var _ = require('underscore');
var Model = require('./model');


var User = module.exports = Model.extend({
    idAttribute: 'uuid',

    urlRoot: "/_/users",

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
        return window.sessionStorage.getItem('api-token') !== null;
    },

    getToken: function() {
        return window.sessionStorage.getItem('api-token');
    },

    getAdminUuid: function() {
        return window.sessionStorage.getItem('admin-uuid');
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
            window.sessionStorage.setItem('api-token', data.token);
            window.sessionStorage.setItem('admin-uuid', data.adminUuid);
            window.sessionStorage.setItem('user-uuid', data.user.uuid);
            window.sessionStorage.setItem('user-login', data.user.login);
            self.trigger('authenticated', self);
        }).error(function(xhr) {
            var err = JSON.parse(xhr.responseText);
            self.trigger('error', err.message);
        });
    },

    signout: function() {
        window.sessionStorage.clear();
        this.trigger('unauthenticated');
    }
});

User.currentUser = function() {
    return new User({
        'token': window.sessionStorage.getItem('api-token') || null,
        'uuid': window.sessionStorage.getItem('user-uuid') || null,
        'login': window.sessionStorage.getItem('user-login') || null,
        'adminUuid': window.sessionStorage.getItem('admin-uuid') || null
    });
};
