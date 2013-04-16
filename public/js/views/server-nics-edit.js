var Backbone = require('backbone');
var _ = require('underscore');
var adminui = require('../adminui');

var ServerNicsEditTemplate = require('../tpl/server-nics-edit.hbs');
var ServerNicsEditView = Backbone.Marionette.ItemView.extend({
    id: "server-nics-edit",
    attributes: {
        'class': 'modal'
    },
    events: {
        'click .save': 'save'
    },
    initialize: function(options) {
        this.nics = options.nics;
        this.server = options.server;
    },
    template: ServerNicsEditTemplate,
    show: function() {
        this.render();
        this.$el.modal('show');
    },

    save: function() {
        var self = this;
        var formData = this.$('form').serializeObject();
        var data = [];
        _.each(formData, function(value, mac) {
            data.push({mac: mac, nic_tags_provided: value.split(" ")});
        });
        this.server.updateNics({nics: data, action: 'replace'}, function(job) {
            self.$el.modal('hide');
            adminui.vent.trigger('showjob', job);
            self.listenTo(job, 'change:execution', function(j) {
                var execution = j.get('execution');
                console.log(execution);
                if (execution === 'succeeded') {
                    self.nics.fetchNics();
                }
            });
        });
    },
    serializeData: function() {
        var data = {
            nics: this.nics.toJSON(),
            server: this.server.toJSON()
        };
        _.each(data.nics, function(n) {
            if (n.nic_tags_provided) {
                n.nic_tags_provided = n.nic_tags_provided.join(" ");
            }
        });
        return data;
    },
    onRender: function() {
    }

});

module.exports = ServerNicsEditView;
