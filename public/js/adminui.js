define(function(require) {
    var _ = require('underscore');
    var Pinger = require('ping');
    var BaseView = require('views/base');
    var Marionette = require('backbone.marionette');

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


    Backbone.Marionette.TemplateCache.prototype.compileTemplate = function(rawTemplate) {
        return Handlebars.compile(rawTemplate);
    };

    Backbone.Marionette.TemplateCache.prototype.loadTemplate = function(templateId) {
        // Marionette expects "templateId" to be the ID of a DOM element.
        // But with RequireJS, templateId is actually the full text of the template.
        var template = templateId;

        // Make sure we have a template before trying to compile it
        if (!template || template.length === 0){
            var msg = "Could not find template: '" + templateId + "'";
            var err = new Error(msg);
            err.name = "NoTemplateError";
            throw err;
        }

        return template;
    };

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

    return AdminUI;
});