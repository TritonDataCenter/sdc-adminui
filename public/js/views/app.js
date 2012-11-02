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


        onRender: function() {
            this.mainnavView.setElement(this.$("#mainnav"));
            this.mainnav.attachView(this.mainnavView);

            // this.topbar.attachView(this.topbarView);
            // this.topbarView.setElement(this.$("#topbar")).render();

            return this;
        }
    });
    return AppView;
});
