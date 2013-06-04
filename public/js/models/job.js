var Model = require('./model');
var Job = Model.extend({
    defaults: {},

    urlRoot: "/_/jobs",

    idAttribute: "uuid",

    finished: function() {
        var execution = this.get('execution');
        return execution === 'canceled' || execution === 'succeeded' || execution === 'failed';
    },

    getJobInfo: function(callback) {
        $.get(this.url() + '/info', function(info) {
            callback(info);
        });
    },

    startWatching: function() {
        var self = this;
        this._interval = setInterval(function() {
            self.fetch();
        }, 1000);
    },

    stopWatching: function() {
        console.log(this);
        clearInterval(this._interval);
    }
});
module.exports = Job;
