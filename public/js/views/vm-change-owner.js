var Backbone = require('backbone');
var Template = require('../tpl/vm-change-owner.hbs');
var app = require('../adminui');

var View = Backbone.Marionette.ItemView.extend({
    attributes: {
        'class': 'modal'
    },

    events: {
        'click button.btn-primary': 'onSubmit'
    },

    initialize: function(options) {
        if (typeof(this.vm) === 'undefined') {
            throw "options.vm not present";
        }

        this.vm = options.vm;
    },

    template: Template,

    show: function() {
        this.render();
        this.$el.modal('show');
        this.$('input:first').focus();
    },

    onSubmit: function(e) {
        e.preventDefault();
        var self = this;
        var owner = this.$('[name=owner_uuid]').val();
        this.vm.update({
            'new_owner_uuid': owner
        }, function(job) {
            app.vent.trigger('showjob', job);
            self.bindTo(job, 'execution', function(status) {
                if (status == 'succeeded') {
                    self.vm.fetch();
                }
            });
            self.$el.modal('hide').remove();
        });
    }
});

module.exports = View;