/**
 * models/user
 */

define(function(require) {
   var Model = require('model');

    return Model.extend({

        defaults: {
            token: null
        },
        idAttribute: 'uuid',
        urlRoot: "/_/users",

        authenticated: function() {
            return this.get('token') !== null;
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
                data.user.token = data.token;
                self.set(data.user);
                self.set('adminUuid', data.adminUuid);
            }).error(function(xhr) {
                var err = JSON.parse(xhr.responseText);
                self.trigger('error', err.message);
            });
        },

        signout: function() {
            $.ajax({
                url: "/_/auth",

                success: function() {
                    this.set({
                        authenticated: false
                    });
                },

                type: "DELETE",
                context: this
            });
        }
    });
});