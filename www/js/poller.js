'use strict';

var Poller = function (interval) {
    this.interval = interval || 5000;
};

Poller.prototype.start = function (callback, interval) {
    this.stop();
    this.poller = setInterval(callback, interval || this.interval);
};

Poller.prototype.stop = function () {
    if (this.poller) {
        clearInterval(this.poller);
        this.poller = null;
    }
};

module.exports = Poller;
