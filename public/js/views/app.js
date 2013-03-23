/**
 * views/app
 *
 * This module manages the Layout & Pane for
 * the application
 */


define(function(require) {
    var Backbone = require('backbone');
    var Topbar = require('views/topbar');
    var Mainnav = require('views/mainnav');

    var JobProgressView = require('views/job-progress');
    var tplChrome = require('tpl!chrome');
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

            this.bindTo(adminui.vent, 'error', this.onError, this);
            this.bindTo(adminui.vent, 'showjob', this.onShowjob, this);
        },

        onError: function(err) {
            err = err || {};
            if (err.xhr && err.xhr.status >= 500) {
                if (err.xhr.responseText.length) {
                    var json = JSON.parse(err.xhr.responseText);
                    err.responseBody = JSON.stringify(json, null, 2);
                }
                var t = require('tpl!error');
                var tpl = Handlebars.compile(t);
                $(tpl(err)).modal();
            }
        },

        onShowjob: function(job) {
            var jobView = new JobProgressView({model: job});
            jobView.show();
        },

        onRender: function() {
            this.mainnav.attachView(this.mainnavView);
            this.mainnavView.setElement(this.$("#mainnav"));

            this.topbar.attachView(this.topbarView);
            this.topbarView.setElement(this.$("#topbar"));
            this.topbarView.renderLoginName();

            return this;
        }
    });
    return AppView;
});
