var _ = require('underscore');
_.str = require('underscore.string');

var Backbone = require('backbone');
require('backbone.stickit');
require('backbone.marionette');

var $ = require('jquery');
require('jquery.serializeObject');
require('bootstrap');
require('kevinykchan-bootstrap-typeahead');

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


var AdminUI = new Backbone.Marionette.Application();

AdminUI.addInitializer(function(options) {
    AdminUI.addRegions({chrome:"#chrome"});
});

AdminUI.on("initialize:after", function(options) {
    this.router = options.router;
    this.router.go();
    Backbone.history.start({pushState: true});

    this.pinger = new Pinger();
    this.pinger.start();
});

module.exports = AdminUI;