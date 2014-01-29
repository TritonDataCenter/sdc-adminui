var NicTags = require('../models/nictags');
var Backbone = require('backbone');

module.exports = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/create-nic-tag.hbs'),
    events: {
        'click .cancel': 'onCancel',
        'click .save': 'onSave'
    },
    initialize: function(options) {
        this.collection = new NicTags();
    },
    onSave: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var self = this;
        var tag = this.$('input').val();
        this.collection.create({name: tag}, {
            success: function(model) {
                console.log('nic tag save', model);
                self.trigger('save', model);
                self.close();
            }
        });
        return false;
    },
    onCancel: function(e) {
        e.preventDefault();
        this.close();
    }
});
