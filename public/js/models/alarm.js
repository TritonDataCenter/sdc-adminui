var Backbone = require('backbone');
var Alarm = Backbone.Model.extend({
    urlRoot: function() {
        return '/api/amon/alarms/' + this.get('user');
    },
    idAttribute: 'id',
    suppress: function(cb) {
        $.post(this.url() + '?action=suppress', {}, cb);
    }
});

module.exports = Alarm;