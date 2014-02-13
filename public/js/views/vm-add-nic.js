var Backbone = require('backbone');
var Networks = require('../models/networks');
var JobProgress = require('./job-progress');
var _ = require('underscore');
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
            primary: this.$('.primary').is(':checked'),
            allow_dhcp_spoofing: this.$('[name=allow_dhcp_spoofing]').is(':checked'),
            allow_ip_spoofing: this.$('[name=allow_ip_spoofing]').is(':checked'),
            allow_mac_spoofing: this.$('[name=allow_mac_spoofing]').is(':checked'),
            allow_restricted_traffic: this.$('[name=allow_restricted_traffic]').is(':checked'),
            allow_unfiltered_promisc: this.$('[name=allow_unfiltered_promisc]').is(':checked')
        }], function(err, job) {
            if (err) {
                window.alert('Error adding network interface ' + err);
                return;
            }
            self.remove();
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

        this.networks.fetch({
            success: function() {
                self.stickit(self.selectedNetwork, bindings);
            }
        });

        this.$el.modal().on('hidden', this.remove.bind(this));
        this.$el.modal('show');
    }
});

module.exports = VmAddNicView;
