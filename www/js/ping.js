"use strict";

var _ = require('underscore');
var api = require('./request');
var Backbone = require('backbone');
var app = require('adminui');

var Pinger = function(options) {
    this.options = options || {};
    this.options.interval = this.options.interval || (60 * 1000);
};

_.extend(Pinger, Backbone.Events);

Pinger.prototype.start = function() {
    this.timer = setInterval(this.ping, this.options.interval);
    this.ping();
};

Pinger.prototype.ping = function() {
    api.get('/api/ping').end(function(res) {
        if (res.ok) {
            console.log('.');
            return;
        }
        if (res.forbidden) {
            app.router.signout();
        }
    });
};

Pinger.prototype.stop = function() {
    clearInterval(this.timer);
};

module.exports = Pinger;
