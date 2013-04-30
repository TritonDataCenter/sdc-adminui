var Backbone = require('backbone');

var Users = require('../models/users');

var UserTypeaheadTemplate = require('../tpl/typeahead-user.hbs');

var UserTypeaheadView = Backbone.Marionette.View.extend({
    events: {
        'typeahead:selected': 'onSelect'
    },
    initialize: function(options) {
        options = options || {};
    },

    onSelect: function(e, datum) {
        var user = this.collection.get(datum.uuid);
        this.trigger('selected', user);
    },

    typeAheadSource: function(users) {
        var source = users.map(function(u) {
            return {
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
