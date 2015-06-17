/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";

var _ = require('underscore');
_.str = require('underscore.string');

window.moment = require('moment');

var $ = require('jquery');
var jQuery = $;

window.jQuery = jQuery;

require('jquery.chosen');
require('jquery.serializeObject');
require('jquery.autosize');

require('bootstrap');
require('bootstrap.datetimepicker');
require('bootstrap.tags');

require('typeahead');

var Backbone = require('backbone');
Backbone.$ = $;

require('backbone.stickit');
require('backbone.marionette');
require('backbone.paginator');

var Handlebars = require('handlebars');
Handlebars.registerHelper('role', function (role, options) {
    var args = Array.prototype.slice.call(arguments);
    var opts = args.pop();
    var userRoles = adminui.user.getRoles();

    for (var i = 0; i <= args.length; i++) {
        if (userRoles.indexOf(args[i]) !== -1) {
            return opts.fn(this);
        }
    }
    return '';
});

Handlebars.registerHelper('debug', function (optionalValue) {
    console.log('Current Context: ', this);

    if (optionalValue) {
        console.log('Value:', optionalValue);
    }
});

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        case '!':
            return (!v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

Handlebars.registerHelper('math', function (v1, operator, v2) {
    v1 = parseFloat(v1);
    v2 = parseFloat(v2);
    switch (operator) {
        case '+':
            return v1 + v2;
        case '-':
            return v1 - v2;
        case '*':
            return v1 * v2;
        case '/':
            return v1 / v2;
        case '||':
            return v1 || v2;
        default:
            return v1 + v2;
    }
});

Handlebars.registerHelper('sizeList', function(context, options) {
    var ret = '';
    for(var i = 0, j = context.length; i < j; i++) {
        ret = ret + options.fn(context[i]) + (i < (j + 1) ? '|' : '');
    }
    return ret ;
});
var Pinger = require('./ping');

/* Extend jQuery with functions for PUT and DELETE requests. */
function _ajax_request(url, data, callback, type, method) {
    if (jQuery.isFunction(data)) {
        callback = data;
        data = {};
    }
    return jQuery.ajax({
        type: method,
        url: url,
        data: data,
        success: callback,
        dataType: type
    });
}

jQuery.extend({
    put: function(url, data, callback, type) {
        return _ajax_request(url, data, callback, type, 'PUT');
    },
    delete_: function(url, data, callback, type) {
        return _ajax_request(url, data, callback, type, 'DELETE');
    }
});

var adminui = window.$a = module.exports = new Backbone.Marionette.Application();
adminui.version = require('../../package.json').version;

adminui.addInitializer(function(options) {
    var Router = require('./router');
    this.pinger = new Pinger();
    this.state = new Backbone.Model();
    this.router = new Router({app: adminui, state: this.state});
});

adminui.on('start', function() {
    this.pinger.start();
    this.router.start();
    Backbone.history.start({pushState: true});
});

