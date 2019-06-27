/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright 2019 Joyent, Inc.
 */

var Backbone = require('backbone');
var _ = require('underscore');

var adminui = require('../adminui');
var $ = require('jquery');
var FormTemplate = require('../tpl/packages-form.hbs');
var Package = require('../models/package');
var UserInput = require('../views/typeahead-user');
var React = require('react');
var ErrorAlert = React.createFactory(require('../components/error-alert'));

var PackageForm = Backbone.Marionette.ItemView.extend({
    template: FormTemplate,
    id: 'page-package-form',
    modelEvents: {
        'error': 'onError'
    },

    events: {
        'submit': 'onSubmit',
        'click a.add-owner-entry': 'onAddOwnerEntry',
        'click a.add-disk-entry': 'onAddDiskEntry',
        'click button[type=cancel]': 'onCancel',
        'input input': 'onChangeInput',
        'change select[name=brand]': 'onChangeSelect'
    },

    initialize: function (options) {
        options = options || {};

        if (!options.model) {
            this.model = new Package({ version: '1.0.0' });
        }
    },

    onAddOwnerEntry: function () {
        var node = $('<input type="text" class="form-control" ' +
            'name="owner_uuids[]" ' +
            'placeholder="Search by login, email or uuid"></div>');

        this.$('.add-owner-entry').before(node);

        var userInput = new UserInput({
            el: $(node),
            showPreview: true
        });

        userInput.render();
        userInput.$el.focus();
    },


    onAddDiskEntry: function () {
        if (this.$('select[name=brand]').val() !== 'bhyve') {
            var msg = 'Disks can be added only to Bhyve branded packages';
            adminui.vent.trigger('notification', {
                level: 'warn',
                message: msg
            });
            return;
        }
        var node = $('<input type="text" class="form-control" ' +
            'name="disks[]" ' +
            'placeholder="Add disk size in MiB or \'remaining\'"></div>');

        this.$('.add-disk-entry').before(node);

        var userInput = new UserInput({
            el: $(node),
            showPreview: true
        });

        userInput.render();
        userInput.$el.focus();
    },

    onChangeInput: function () {
        console.log('changeInput');
        this.checkFields();
    },

    checkFields: function () {
        if (this.options.mode !== 'change-owner') {
            if (this.$('input[name=version]').val().length) {
                this.$('button[type=submit]').prop('disabled', false);
            } else {
                this.$('button[type=submit]').prop('disabled', true);
            }
        }
    },

    onChangeSelect: function () {
        console.log('changeSelect');
        this.checkBrandSpecifics();
    },

    checkBrandSpecifics: function () {
        if (this.$('select[name=brand]').val() === 'bhyve') {
            this.$('input[name=flexible_disk]').prop('disabled', false);
            this.$('input[name="disks[]"]').prop('disabled', false);
        } else {
            this.$('input[name=flexible_disk]').prop('disabled', true);
            this.$('input[name="disks[]"]').prop('disabled', true);
        }
    },

    onError: function (_model, xhr) {
        var error = xhr.responseData;
        this.renderError(error);

        $('body').animate({
            scrollTop: 0
        }, 200);
    },

    onCancel: function (e) {
        e.preventDefault();

        if (this.model.isNew()) {
            adminui.vent.trigger('showview', 'packages');
        } else {
            adminui.vent.trigger('showview', 'package', { model: this.model });
        }
    },

    onSubmit: function (e) {
        e.preventDefault();

        var values = Backbone.Syphon.serialize(this);
        values.owner_uuids = _.compact(values.owner_uuids);
        if (this.options.mode !== 'change-owner' && values.disks) {
            values.disks = _.compact(values.disks);
            values.disks = _.map(values.disks, function (size) {
                return ({ size: (size === 'remaining') ? size : Number(size) });
            });
        }

        if (this.options.mode === 'new-version') {
            this.model.unset('uuid');
        }


        _.each(values, function (v, k) {
            if (typeof (v) === 'string' && /^\d+$/.test(v)) {
                values[k] = Number(v);
            }
            if (k === 'name' || k === 'version') {
                values[k] = _.str.trim(v);
            }
        });
        console.log('package values', values);

        this.model.save(values, {
            patch: true,
            success: function (model, resp) {
                adminui.vent.trigger('showview', 'package', {model: model});
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: 'Package saved succesfully.'
                });
            }
        });
    },

    serializeData: function () {
        var data = this.model.toJSON();
        if (data.owner_uuid && _.isArray(data.owner_uuid) === false) {
            data.owner_uuid = [data.owner_uuid];
        }
        console.log(this.options.mode);
        data.newVersionMode = this.options.mode === 'new-version';
        data.changeOwnerMode = this.options.mode === 'change-owner';

        return data;
    },
    renderError: function (error) {
        var c = this.$('.error-alert-container').get(0);
        React.render(ErrorAlert({error: error}), c);
    },

    onRender: function () {
        this.userInput = new UserInput({
            el: this.$('.package-owner'), showPreview: true
        });
        this.userInput.render();
        this.checkFields();
    },

    onShow: function () {
        if (this.options.mode === 'new-version') {
            this.$('#package-version').focus();
        } else {
            this.$('input:first').focus();
        }
        $('[data-toggle="tooltip"]').tooltip();
    }
});

module.exports = PackageForm;
