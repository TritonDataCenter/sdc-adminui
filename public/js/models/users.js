var Backbone = require('backbone');
var User = require('./user');
var Users = Backbone.Collection.extend({
    model: User,
    url: '/_/users',

    userCount: function(successCb) {
        $.get('/_/users/count', function(res) {
            successCb(res.count);
        });
    },

    searchByLogin: function(login, successCb) {
        this.fetch({
            data: $.param({
                'login': login
            }),
            success: successCb
        });
    }
});

module.exports = Users;