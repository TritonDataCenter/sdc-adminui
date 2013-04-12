var Backbone = require('backbone');

var Users = require('../models/users');

var UserTypeaheadTemplate = require('../tpl/typeahead-user.hbs');

var UserTypeaheadView = Backbone.Marionette.ItemView.extend({
    initialize: function(options) {
        this.model = new Users();
        this.listenTo(this.model, 'sync', this.onUpdate, this);
        this.model.fetch();
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