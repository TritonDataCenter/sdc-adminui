var Backbone = require('backbone');
var Networks = require('../models/networks');
var JobProgress = require('./job-progress');
var VmAddNicView = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/vm-add-nic.hbs'),
    attributes: {
        'class': 'modal'
    },
    events: {
        'click button[type=submit]': 'onSubmit'
    },

    initialize: function(options) {
        this.vm = options.vm;
        this.selectedNetwork = new Backbone.Model();
        this.networks = new Networks();
    },

    onSubmit: function() {
        var self = this;
        var vm = this.vm;
        var netuuid = this.selectedNetwork.get('uuid');
        vm.addNics([{
            uuid: netuuid,
            primary: this.$('.primary').is(':checked')
        }], function(err, job) {
            if (err) {
                window.alert('Error adding network interface ' + err);
                return;
            }
            self.$el.modal('hide').remove();
            var view = new JobProgress({
                model: job
            });
            view.show();
            self.listenTo(view, 'execution', function(st) {
                if (st === 'succeeded') {
                    vm.fetch();
                }
            });
        });
    },

    onRender: function() {
        var self = this;
        var bindings = {
            'button[type=submit]': {
                attributes: [{
                    observe: 'uuid',
                    name: 'disabled',
                    onGet: function(val, attrName) {
                        return !val.length;
                    }
                }]
            },
            'select[name=network]': {
                observe: 'uuid',
                selectOptions: {
                    collection: function() {
                        var col = self.networks.toJSON();
                        col = _(col).map(function(n) {
                            n.label = [n.name, n.subnet].join(' - ');
                            return n;
                        });
                        col.unshift({
                            label: 'Select a Network'
                        });
                        return col;
                    },
                    labelPath: 'label',
                    valuePath: 'uuid'
                }
            }
        };

        this.$el.modal('show');
        this.networks.fetch({
            success: function() {
                self.stickit(self.selectedNetwork, bindings);
            }
        });
    }
});

module.exports = VmAddNicView;
