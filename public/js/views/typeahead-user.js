var Backbone = require('backbone');

var User = require('../models/user');

var UserTypeaheadTemplate = require('../tpl/typeahead-user.hbs');

var UserTypeaheadView = Backbone.Marionette.View.extend({
    events: {
        'typeahead:selected': 'onSelect'
    },
    initialize: function(options) {
        options = options || {};
    },

    onSelect: function(e, datum) {
        this.trigger('selected', datum.model);
    },

    typeAheadSource: function(users) {
        var source = users.map(function(u) {
            return {
                model: new User(u),
                'uuid': u.uuid,
                'tokens': [u.login, u.uuid, u.email],
                'name': u.cn,
                'login': u.login,
                'email': u.email
            };
        });

        return source;
    },
    render: function() {
        this.$el.typeahead({
            name: 'users',
            remote: {
                url: '/_/users?q=%QUERY',
                cache: true,
                filter: this.typeAheadSource
            },
            valueKey: 'uuid',
            template: UserTypeaheadTemplate
        });
    }
});

module.exports = UserTypeaheadView;
