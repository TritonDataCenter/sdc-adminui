var _ = require('underscore');
_.str = require('underscore.string');

var Backbone = require('backbone');
Backbone.$ = require('jquery');
require('jquery.chosen');

require('backbone.stickit');
require('backbone.marionette');

require('jquery.serializeObject');
require('bootstrap');
require('typeahead');

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

$.extend({
    put: function(url, data, callback, type) {
        return _ajax_request(url, data, callback, type, 'PUT');
    },
    delete_: function(url, data, callback, type) {
        return _ajax_request(url, data, callback, type, 'DELETE');
    }
});


var adminui = module.exports = new Backbone.Marionette.Application();

adminui.addInitializer(function(options) {
    var Router = require('./router');
    this.addRegions({chrome:"#chrome"});
    this.pinger = new Pinger();
    this.router = new Router({app: adminui});
});

adminui.on('start', function() {
    this.pinger.start();
    this.router.start();
    Backbone.history.start({pushState: true});
});

