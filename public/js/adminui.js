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


var Handlebars = require('handlebars');
Handlebars.registerHelper('role', function(role, options) {
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

