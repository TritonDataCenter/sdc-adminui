var Backbone = require('backbone');
var Template = require('../tpl/vm-change-owner.hbs');
var app = require('../adminui');

var UserInput = require('./typeahead-user');

var View = Backbone.Marionette.ItemView.extend({
    id: 'vm-change-owner',
    attributes: {
        'class': 'modal'
    },

    events: {
        'click button.btn-primary': 'onSubmit'
    },

    initialize: function(options) {
        if (typeof(options.vm) === 'undefined') {
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

    onRender: function() {
        this.userInput = new UserInput({el: this.$('input[name=owner_uuid]')});
    },

    onSubmit: function(e) {
        e.preventDefault();
        var self = this;
        var owner = this.$('[name=owner_uuid]').val();
        this.vm.update({
            'new_owner_uuid': owner
        }, function(job) {
            app.vent.trigger('showjob', job);
            self.listenTo(job, 'execution', function(status) {
                if (status === 'succeeded') {
                    self.vm.fetch();
                }
            });
            self.$el.modal('hide').remove();
        });
    }
});

module.exports = View;