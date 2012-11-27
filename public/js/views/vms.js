define(function(require) {
    /**
     * views/vms.js
     */
    var Vms = require('models/vms');
    var VmsList = require('views/vms-list');
    var VmsTemplate = require('text!tpl/vms.html');

    var app = require('adminui');

    var FilterForm = Backbone.View.extend({
        events: {
            'submit form': 'onSubmit',
            'change input': 'onSubmit',
            'change select': 'onSubmit'
        },
        onSubmit: function(e) {
            e.preventDefault();

            var params = this.$('form').serializeObject();
            this.trigger('query', params);
        }
    });

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
            this.filterView = new FilterForm();
            this.collection.fetch();
        },

        provision: function() {
            app.vent.trigger('showview', 'provision-vm', {});
        },

        query: function(params) {
            this.$('.alert').hide();
            this.collection.fetch({data: params});
        },

        onError: function(model, res) {
            var obj = JSON.parse(res.responseText);
            var errors = _.map(obj.errors, function(e) {
                return e.message;
            });
            this.$(".alert").html(errors.join('<br>')).show();
        },

        onShow: function() {
            this.$('.alert').hide();
        },

        onRender: function() {
            this.listView.setElement(this.$('tbody')).render();
            this.filterView.setElement(this.$('.vms-filter'));

            this.bindTo(this.collection, 'error', this.onError, this);
            this.bindTo(this.filterView, 'query', this.query, this);
            return this;
        }
    });
});