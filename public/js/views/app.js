/**
 * views/chrome
 *
 * This module manages the Layout & Pane for
 * the application
 *
 * -------------------------------------+
 *        TOP  BAR                      |
 * -------------------------------------+
 *          |                           |
 * sidebar  |          content          |
 *          |                           |
 *          |                           |
 */


define(function(require) {
    var Backbone = require('backbone');
    
    var Topbar = require('views/topbar');
    var Mainnav = require('views/mainnav');

    var tplChrome = require('text!tpl/chrome.html');
    var adminui = require('adminui');

    var AppView = Backbone.Marionette.Layout.extend({
        template: tplChrome,
        attributes: {id:"app"},

        regions: {
            'topbar': "#topbar",
            'mainnav': "#mainnav",
            'content': "#content"
        },

        initialize: function(options) {
            this.options = options || {};
            this.user = options.user;

            this.topbarView = new Topbar({ user: this.user });
            this.mainnavView = new Mainnav();
        },

        onError: function(err) {
            err = err || {};
            if (err.xhr && err.xhr.status >= 500) {
                if (err.xhr.responseText.length) {
                    var json = JSON.parse(err.xhr.responseText);
                    err.responseBody = JSON.stringify(json, null, 2);
                }
                var t = require('text!tpl/error.html');
                var tpl = Handlebars.compile(t);
                $(tpl(err)).modal();
            }
        },

        onRender: function() {
            this.mainnavView.setElement(this.$("#mainnav"));
            this.mainnav.attachView(this.mainnavView);

            this.bindTo(adminui.vent, 'error', this.onError);

            // this.topbar.attachView(this.topbarView);
            // this.topbarView.setElement(this.$("#topbar")).render();

            return this;
        }
    });
    return AppView;
});
