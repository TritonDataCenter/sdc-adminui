define(['jquery', 'underscore', 'backbone'], function($, _, Backbone) {
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
        $.get('/_/ping', function() { console.log('.'); });
    };

    Pinger.prototype.stop = function() {
        clearInterval(this.timer);
    };

    return Pinger;
});