var Backbone = require('backbone');
var _ = require('underscore');
var app = require('../adminui');

var Template = require('../tpl/server-setup.hbs');
var ViewModel = Backbone.Model.extend({});
var ServerSetupView = Backbone.Marionette.ItemView.extend({
    template: Template,
    id: 'server-setup',
    attributes: {
        'class': 'modal'
    },
    events: {
        'click .setup': 'setup'
    },
    initialize: function(options) {
        this.viewModel = new ViewModel({customHostname: false});
    },
    setup: function() {
        var server = this.model;
        var self = this;
        var hostname = this.$('input[name=hostname]').val();
        this.model.setup({hostname: hostname}, function(job) {
            app.vent.trigger('showjob', job);
            self.listenTo(job, 'execution', function(status) {
                if (status === 'succeeded') {
                    server.fetch();
                }
                app.vent.trigger('notification', {
                    level: 'success',
                    message: _.str.sprintf('Server %s setup complete.', server.get('hostname'))
                });
            });
            self.$el.modal('hide').remove();
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
module.exports = ServerSetupView;
