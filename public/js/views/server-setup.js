define(function(require) {
    var app = require('adminui');
    var Template = require('tpl!server-setup');
    var ViewModel = Backbone.Model.extend({});
    var ServerSetupView = Backbone.Marionette.ItemView.extend({
        template: Template,
        id: 'server-setup',
        attributes: {
            'class': 'modal'
        },
        events: {
            'click setup': 'setup'
        },
        initialize: function(options) {
            this.viewModel = new ViewModel({customHostname: false});
        },
        setup: function() {
            var server = this.model;
            var self = this;
            var hostname = this.$('.custom-hostname').val();
            this.model.setup({hostname: hostname}, function(job) {
                self.remove();
                app.vent.trigger('showjob', job);
                self.bindTo(job, 'execution', function(status) {
                    if (status === 'succeeded') {
                        server.fetch();
                    }
                });
            });
        },
        onRender: function() {
            this.stickit(this.model, {
                '.custom-hostname': {
                    observe: 'customHostname'
                },
                '.custom-hostname-container': {
                    observe: 'customHostname',
                    updateView: false,
                    visible: true
                }
            });
            this.$el.modal('show');
        }
    });
    return ServerSetupView;
});