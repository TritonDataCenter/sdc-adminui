/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');



var AnalyticsView = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/analytics.hbs'),
    url: '/analytics',
    sidebar: 'analytics',
    onShow: function() {
        console.log("VisContainer", $("#visContainer"));
        this.$el.append('<script language="javascript" type="text/javascript" src="/ca-vis/create.js"></script>');
    }
});


module.exports = AnalyticsView;

