var Backbone = require('backbone');

var Users = require('../models/users');

var UserTypeaheadTemplate = require('../tpl/typeahead-user.hbs');

var UserTypeaheadView = Backbone.Marionette.ItemView.extend({
    events: {
        'typeahead:selected': 'onSelect'
    },
    initialize: function(options) {
        options = options || {};
        this.collection = options.collection || new Users();
        this.listenTo(this.collection, 'sync', this.onUpdate, this);
        this.collection.fetch();
    },
    onSelect: function(e, datum) {
        var user = this.collection.get(datum.uuid);
        this.trigger('selected', user);
    },
    onUpdate: function(users) {
        var source = users.map(function(u) {
            return {
                'uuid': u.get('uuid'),
                'tokens': [u.get('login'), u.get('uuid'), u.get('email')],
                'name': u.get('cn'),
                'login': u.get('login'),
                'email': u.get('email')
            };
        });

        this.$el.typeahead({
            name: 'users',
            local: source,
            valueKey: 'uuid',
            template: UserTypeaheadTemplate
        });
    }
});

module.exports = UserTypeaheadView;
