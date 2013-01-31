define(function(require) {
    var Template = require('text!tpl/networks-create.html');
    var Network = require('models/network');
    var NicTags = require('models/nictags');

    var View = Backbone.Marionette.ItemView.extend({
        template: Template,

        events: {
            'submit form': 'onSubmit',
            'click .create-new-nic-tag': 'onClickCreateNewNicTag'
        },

        ui: {
            'alert': '.alert',
            'nicTagSelect': 'select[name=nic_tag]',
            'newNicTagField': 'input[name=nic_tag]',
            'createNewNicTagButton': '.create-new-nic-tag'
        },

        modelEvents: {
            'error': 'onError'
        },

        initialize: function() {
            this.modelBinder = new Backbone.ModelBinder();
            this.model = new Network();
            this.nicTags = new NicTags();
            this.nicTagsSelect = new Backbone.Marionette.CollectionView({
                itemView: Backbone.View.extend({
                    tagName: 'option',
                    render: function() {
                        var name = this.model.get('name');
                        this.$el.text(name);
                        this.$el.attr("value", name);
                    }
                }),
                collection: this.nicTags
            });
        },

        onClickCreateNewNicTag: function() {
            this.ui.nicTagSelect.hide();
            this.ui.createNewNicTagButton.hide();
            this.ui.newNicTagField.show().focus();
        },

        onSubmit: function(e) {
            var self = this;
            e.preventDefault();
            this.model.save(null, {success: function(model) {
                self.trigger('saved', model);
            }});
        },

        onError: function(model, xhr, options) {
            var fieldMap = {
                'name': '[name=name]',
                'subnet': '[name=subnet]',
                'gateway': '[name=gateway]',
                'provision_start_ip': '[name=provision_start_ip]',
                'provision_end_ip': '[name=provision_end_ip]',
                'resolvers': '[name=resolvers]',
                'nic_tag': '[name=nic_tag]',
                'vlan_id': '[name=vlan_id]'
            };
            var err = xhr.responseData;
            this.ui.alert.find('.message').html(err.message);
            this.$('.control-group').removeClass('error');
            _.each(err.errors, function(errObj) {
                var field = $(fieldMap[errObj.field]);
                field.parents('.control-group').addClass('error');
            }, this);
            this.ui.alert.find('.error').html(err.message);
            this.ui.alert.show();
        },



        onRender: function() {
            this.ui.newNicTagField.hide();
            this.nicTagsSelect.setElement(this.$('select[name=nic_tag]'));
            this.nicTags.fetch();
            var bindings = Backbone.ModelBinder.createDefaultBindings(this.el, 'name');
            bindings['resolvers'].converter = function(direction, value, attrName, model) {
                if (direction == 'ModelToView') {
                    return (value || []).join(',');
                } else {
                    return value.split(',');
                }
            };
            this.modelBinder.bind(this.model, this.el, bindings);
        },

        onShow: function() {
            this.$('.alert').hide();
        },

        onClose: function() {
            this.modelBinder.unbind();
        }
    });

    return View;
});