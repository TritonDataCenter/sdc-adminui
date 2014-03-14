

/**
 * ./app
 *
 * This module manages the Layout & Pane for
 * the application
 */


var Backbone = require('backbone');
var adminui = require('./adminui');

var Mainnav = require('./mainnav');
var Notifier = require('./notifier');

var JobProgressView = require('./job-progress');

var tplChrome = require('../tpl/chrome.hbs');

var AppView = Backbone.Marionette.Layout.extend({
    template: tplChrome,
    attributes: {id:"app"},

    regions: {
        'mainnav': "#rootnav",
        'content': "#content"
    },

    initialize: function(options) {
        this.options = options || {};
        this.user = options.user;
        this.vent = options.vent;

        this.mainnavView = new Mainnav({
            user: this.user,
            vent: this.vent
        });
        this.notifier = new Notifier({ vent: this.vent });

        this.listenTo(this.vent, 'error', this.onError, this);
        this.listenTo(this.vent, 'showjob', this.onShowjob, this);

        this.content.on('show', function(view) {
            $(document.body).scrollTop(0);
        });
    },

    onError: function(err) {
        err = err || {};
        if (err.xhr && err.xhr.status >= 500) {
            if (err.xhr.responseText.length) {
                var json = JSON.parse(err.xhr.responseText);
                err.responseBody = JSON.stringify(json, null, 2);
            }
            var tpl = require('../tpl/error.hbs');
            $(tpl(err)).modal();
        }
    },

    onShowjob: function(job) {
        var jobView = new JobProgressView({model: job});
        jobView.show();
    },

    onRender: function() {
        this.mainnav.attachView(this.mainnavView);
        this.mainnavView.setElement(this.$("#rootnav"));
        this.mainnavView.onShow();
        this.notifier.setElement(this.$("#notifications"));

        return this;
    }
});
module.exports = AppView;

