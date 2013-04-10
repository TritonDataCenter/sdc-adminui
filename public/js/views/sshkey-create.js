var Backbone = require('backbone');


var SSHKey = require('../models/sshkey');

module.exports = Backbone.Marionette.ItemView.extend({
    className: 'modal',
    template: require('../tpl/sshkey-create.hbs'),
    events: {
        'click button.save': 'onClickSave'
    },
    modelEvents: {
        'sync': 'onModelSync',
        'error': 'onModelError'
    },

    initialize: function(options) {
        if (typeof(options.user) !== 'string') {
            throw new TypeError('options.user {string} required');
        }

        this.model = new SSHKey({
            user: options.user
        });
    },

    onModelSync: function(model) {
        this.trigger('saved', model);
        this.$el.modal('hide').remove();
    },

    onModelError: function(model, xhr, error) {
        this.$('textarea').parents('.control-group').addClass('error');
        this.$(".alert").html(xhr.responseData.message);
        this.$(".alert").show();
    },

    onClickSave: function() {
        this.$('textarea').parents('.control-group').removeClass('error');
        var key = this.$('textarea[name=key]').val();
        this.model.save({
            key: key
        });
    },

    onRender: function() {
        this.$el.modal();
        this.$('.alert').hide();
    }
});