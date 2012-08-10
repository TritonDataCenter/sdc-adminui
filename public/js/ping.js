var Pinger = function(options) {
  this.options = options || {};
  this.options.interval = this.options.interval || (60 * 1000);
};

_.extend(Pinger, Backbone.Events);

Pinger.prototype.start = function() {
  this.timer = setInterval(function() {
    $.get('/_/ping', function() { console.log('.'); });
  }, this.options.interval);
};

Pinger.prototype.stop = function() {
  clearInterval(this.timer);
};

module.exports = Pinger;
