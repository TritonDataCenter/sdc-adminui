var Backbone = require('backbone');
var adminui = require('../adminui');


var UserPreview = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/user-preview.hbs'),
    attributes: {
        'class': 'user-preview'
    },
    events: {
        'click a.user-details-link': 'gotoUser'
    },
    gotoUser: function(e) {
        e.preventDefault();
        adminui.vent.trigger('showcomponent', 'user', { uuid: this.model.get('uuid') });
    }
});

module.exports = UserPreview;
