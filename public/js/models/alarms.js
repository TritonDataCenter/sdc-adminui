define(function(require) {

    return Backbone.Collection.extend({
        url: '/_/amon/alarms',

        parse: function(resp) {
            var data = Backbone.Model.prototype.parse.call(this, resp);
            if (data.timeOpened) {
                data.timeOpened = new Date(data.timeOpened);
            }
            if (data.timeClosed) {
                data.timeClosed = new Date(data.timeClosed);
            }
            if (data.timeLastEvent) {
                data.timeLastEvent = new Date(data.timeLastEvent);
            }
            return data;
        },

        fetchAlarms: function(userUuid) {
            var params = $.param({user: userUuid});
            this.fetch({ data: params });
        }
    });
});