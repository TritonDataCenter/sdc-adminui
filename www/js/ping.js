/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";

var api = require('./request');
var app = require('adminui');

var PING_INTERVAL = (30 * 1000);
var EventEmitter = require('events').EventEmitter;


var Pinger = function(options) {
    EventEmitter.call(this);
    this.options = options || {};
    this.options.interval = this.options.interval || PING_INTERVAL;
};
Pinger.prototype = new EventEmitter();

Pinger.prototype.start = function() {
    this.timer = setInterval(this.ping.bind(this), this.options.interval);
    this.ping();
};

Pinger.prototype.ping = function() {
    var self = this;
    api.get('/api/ping').end(function(res) {
        if (res.ok) {
            self.emit('ping', null, res.body);
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
