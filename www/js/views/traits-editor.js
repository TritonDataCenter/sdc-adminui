/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');



var View = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/traits-editor.hbs'),
    attributes: {
        'class':'modal',
        'id': 'traits-editor'
    },
    events: {
        'input textarea': 'checkSyntax',
        'click .btn-primary': 'onClickSave'
    },
    initialize: function(options) {
        options = options || {};
        this.data = options.traits || options.data || {};
        this.title = options.title || "JSON Editor";
    },
    onRender: function() {
        this.$('textarea').text(JSON.stringify(this.data, null, 2));
        this.$('h2').html(this.title);
    },
    serializeData: function() {
        return this.options;
    },
    checkSyntax: function() {
        try {
            var data = JSON.parse(this.$('textarea').val());
            this.$('.btn-primary').removeAttr('disabled');
            this.$('.error').empty();
            return data;
        } catch (e) {
            this.$('.btn-primary').attr('disabled', 'disabled');
            this.showError('JSON Error: ' + e.message);
        }
    },
    onClickSave: function() {
        var data;
        try {
            data = JSON.parse(this.$('textarea').val());
        } catch (e) {
            this.showError('JSON Error: ' + e.message);
        } finally {
            if (data !== null) {
                this.trigger('save', data);
            }
        }
    },

    showError: function(message) {
        this.$('.error').text(message);
    },

    close: function() {
        this.$el.modal('hide');
        this.remove();
    },

    show: function() {
        this.render();
        this.$el.modal();
    }
});

module.exports = View;
