var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Marionette.ItemView.extend({
    id: 'server-boot-options',
    template: require('../tpl/server-boot-options.hbs'),
    events: {
        'click .save': 'onSave',
        'click .cancel': 'onCancel'
    },

    serializeData: function() {
        var data = _.clone(this.model.toJSON());
        data.kernel_args = JSON.stringify(data.kernel_args, null, 2);
        return data;
    },

    onRender: function() {
        this.$('textarea').autosize();
    },

    onCancel: function() {
        this.trigger('cancel');
    },

    onSave: function(e) {
        e.preventDefault();
        var self = this;

        var data = {
            kernel_args: JSON.parse(this.$('textarea').val()),
            platform: this.$('.platform').val()
        };

        this.model.save(data).done(function() {
            self.trigger('saved');
        });
    }

});
