define(function(require) {
    var Networks = require('models/networks');
    var VmAddNicView = Backbone.Marionette.ItemView.extend({
        template: require('text!tpl/vm-add-nic.html'),
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
            var netuuid = this.selectedNetwork.get('uuid');
            this.vm.addNics([{uuid:netuuid}], function(res) {
                self.$el.modal('hide').remove();
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
                            col.unshift({label:'Select a Network'});
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

    return VmAddNicView;

});