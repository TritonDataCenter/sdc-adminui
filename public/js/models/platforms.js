define(function(require) {
    var Backbone = require('backbone');
    var Platforms = Backbone.Collection.extend({
        url: '/_/platforms',
        parse: function(res) {
            var arr = [];
            _.each(res, function(n, d) {
                arr.push({
                    version: d,
                    latest: n.latest
                });
            });
            return arr;
        }
    });

    return Platforms;
});