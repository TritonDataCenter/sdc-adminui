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
    var tplChrome = require('text!tpl/chrome.html');
    var adminui = require('adminui');

    var AppView = Backbone.Marionette.Layout.extend({

        template: tplChrome,

        attributes: {id:"app"},

        regions: {
            'topbar': "#topbar",
            'content': "#content"
        },

        appEvents: {
            'hide': 'hideApp'
        },

        hideApp: function() {
            this.$el.hide();
        },

        initialize: function(options) {
            this.options = options || {};
            this.user = options.user;

            this.topbarView = new Topbar({ user: this.user });
            this.bindTo(this.content, 'view:show', this.contentViewChanged, this);
        },

        contentViewChanged: function(view) {
            if (typeof(view.uri) === 'function') {
                Backbone.history.navigate(view.uri());
            } else if (typeof(view.uri) === 'string') {
                Backbone.history.navigate(view.uri);
            } else {
                Backbone.history.navigate(view.name);
            }
        },

        onRender: function() {
            console.log('layout:render');
            this.topbarView.setElement(this.$("#topbar")).render();
            this.topbar.attachView(this.topbarView);

            var indicator = this.$('.network-activity-indicator');

            indicator.hide();
            indicator.hide().ajaxStart(function() {
                indicator.fadeIn(100);
            });

            indicator.ajaxStop(function() {
                if (! indicator.hasClass('error')) {
                    indicator.fadeOut(100);
                }
            });

            return this;
        }
    });
    return AppView;
});
