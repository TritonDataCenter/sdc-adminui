define(function(require) {
    /**
     * views/vms.js
     */
    var Vms = require('models/vms');
    var VmsList = require('views/vms-list');
    var VmsTemplate = require('text!tpl/vms.html');

    var app = require('adminui');

    return Backbone.Marionette.ItemView.extend({
        name: 'vms',

        template: VmsTemplate,

        url: function() {
            return 'vms';
        },

        events: {
            'click .provision-button':'provision'
        },

        initialize: function(options) {
            this.collection = new Vms();
            this.listView = new VmsList({ collection: this.collection });
            this.collection.fetch();
        },

        provision: function() {
            app.vent.trigger('showview', 'provision-vm', {});
        },

        onRender: function() {
            this.listView.setElement(this.$('tbody')).render();

            return this;
        }
    });
});