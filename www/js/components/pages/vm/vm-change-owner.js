/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var Template = require('./vm-change-owner.hbs');

var UserInput = require('../../../views/typeahead-user');

var View = Backbone.Marionette.ItemView.extend({
    id: 'vm-change-owner',
    attributes: {
        'class': 'modal'
    },

    events: {
        'click button.btn-primary': 'onSubmit'
    },

    initialize: function(options) {
        if (typeof(options.vm) === 'undefined') {
            throw "options.vm not present";
        }
        this.app = options.app;
        this.vm = options.vm;
    },

    template: Template,

    show: function() {
        this.render();
        var self = this;
        this.$el.modal().on('hidden.bs.modal', function() {
            self.remove();
        });
        this.$('input:first').focus();
    },

    onSelectUser: function() {
        this.$('.btn-primary').prop('disabled', false);
    },

    onRender: function() {
        this.userInput = new UserInput({
            accountsOnly: true,
            el: this.$('input[name=owner_uuid]')
        });

        this.listenTo(this.userInput, 'selected', this.onSelectUser);
        this.userInput.render();
        this.$('.btn-primary').prop('disabled', true);
    },

    onSubmit: function(e) {
        e.preventDefault();
        var self = this;
        var vm = this.vm;
        var owner = this.$('[name=owner_uuid]').val();
        this.vm.update({
            'new_owner_uuid': owner
        }, function(job, err) {
            if (err) {
                console.log(err);
                window.alert('Error changing Container owner, '+ err.message);
                return;
            }
            self.$el.modal('hide').remove();
            self.app.vent.trigger('showjob', job);
            job.on('execution:succeeded', function() {
                console.log('[VMChangeOwner] success');
                vm.set({owner_uuid: owner});
            });
        });
    }
});

module.exports = View;
