var Backbone = require('backbone');
var _ = require('underscore');

var adminui = require('../adminui');
var FormTemplate = require('../tpl/packages-form.hbs');
var Package = require('../models/package');
var UserInput = require('../views/typeahead-user');

var PackageForm = Backbone.Marionette.ItemView.extend({
    template: FormTemplate,
    id: 'page-package-form',
    modelEvents: {
        'error': 'onError'
    },

    events: {
        'submit': 'onSubmit',
        'click a.add-owner-entry': 'onAddOwnerEntry',
        'click button[type=cancel]': 'onCancel'
    },

    initialize: function(options) {
        options = options || {};

        if (!options.model) {
            this.model = new Package({ version: "1.0.0" });
        }
    },

    onAddOwnerEntry: function() {
        var node = $(['<div class="controls">',
        '<input type="text"',
        'class="input-xlarge"',
        'name="owner_uuids[]"',
        'placeholder="Search by login or uuid">',
        '</div>'].join(''));

        this.$('.add-owner-entry').before(node);

        var userInput = new UserInput({
            el: $('input', node)
        });

        userInput.render();
        userInput.el.focus();
    },

    onError: function(model, xhr) {
        var ul = $("<ul />");
        this.$('.control-group').removeClass('error');
        _(xhr.responseData.message.split("\n")).each(function(e) {
            ul.append('<li>'+e+'</li>');
        });

        this.$(".alert")
            .empty()
            .append('<h4 class="alert-heading">Please fix the following errors</h4>')
            .append(ul)
            .show();

        $('body').animate({
            scrollTop: this.$('.alert').offset().top
        }, 200);
    },

    onCancel: function(e) {
        e.preventDefault();

        if (this.model.isNew()) {
            adminui.vent.trigger('showview', 'packages');
        } else {
            adminui.vent.trigger('showview', 'packages', { model: this.model });
        }
    },

    onSubmit: function(e) {
        e.preventDefault();

        var values = Backbone.Syphon.serialize(this);
        values.owner_uuid = _.compact(values.owner_uuid);

        if (this.options.mode === 'new-version') {
            this.model.unset('uuid');
        }


        _.each(values, function(v, k) {
            if (typeof(v) === 'string' && /^\d+$/.test(v)) {
                values[k] = Number(v);
            }
        });
        console.log('package values', values);

        var self = this;
        this.model.save(values, {
            patch: true,
            success: function(model, resp) {
                adminui.vent.trigger('showview', 'package', {model:  model});
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: "Package saved succesfully."
                });
            }
        });
    },

    serializeData: function() {
        var data = this.model.toJSON();
        if (data.owner_uuid && _.isArray(data.owner_uuid) === false) {
            data.owner_uuid = [data.owner_uuid];
        }
        console.log(this.options.mode);
        data.newVersionMode = this.options.mode === 'new-version';
        data.changeOwnerMode = this.options.mode === 'change-owner';

        return data;
    },

    onRender: function() {
        this.userInput = new UserInput({el: this.$('.package-owner')});
        this.userInput.render();
    },

    onShow: function() {
        if (this.options.mode === 'new-version') {
            this.$("#package-version").focus();
        } else {
            this.$('input:first').focus();
        }
    }
});

module.exports = PackageForm;
