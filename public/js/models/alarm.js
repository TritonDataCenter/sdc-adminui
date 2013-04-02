define(function(require) {
    var Alarm = Backbone.Model.extend({
        urlRoot: function() {
            return '/_/amon/alarms/' + this.get('user');
        },
        idAttribute: 'id',
        suppress: function(cb) {
            $.post(this.url() + '?action=suppress', {}, cb);
        }
    });

    return Alarm;
});