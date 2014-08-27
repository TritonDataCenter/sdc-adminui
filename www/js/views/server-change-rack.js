/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');


var ChangeRackFormTemplate = function() {
    return '<input class="form-control" type="text"><button class="btn btn-primary save">Save</button><button class="btn btn-link cancel">Cancel</button>';
};

var ChangeRackForm = Backbone.Marionette.ItemView.extend({
    attributes: {
        'class': 'change-rack-form'
    },
    template: ChangeRackFormTemplate,
    events: {
        'keyup': 'keyup',
        'click button.save': 'save',
        'click button.cancel': 'cancel'
    },
    keyup: function(e) {
        if (e.which === 13) {
            this.save();
        }
    },
    onRender: function() {
        this.$('input').focus();
    },
    save: function() {
        var self = this;
        var rid = this.$('input').val();
        this.model.save({rack_identifier: rid }, {patch: true}).done(function() {
            self.trigger('save', rid);
        });
    },
    cancel: function() {
        this.trigger('cancel');
        this.remove();
    }
});

module.exports = ChangeRackForm;
