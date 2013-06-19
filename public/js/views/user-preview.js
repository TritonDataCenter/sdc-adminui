var Backbone = require('backbone');



var UserPreview = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/user-preview.hbs'),
    attributes: {
        'class': 'user-preview'
    }
});

module.exports = UserPreview;
