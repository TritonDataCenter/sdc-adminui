/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');


var Template = require('../tpl/applications-create.hbs');
var View = Backbone.Marionette.ItemView.extend({
    template: Template,
    id: 'application-create',
    attributes: {
        'class': 'modal'
    },
    show: function() {
        this.render();
        this.$el.modal('show');
    }
});

module.exports = View;
