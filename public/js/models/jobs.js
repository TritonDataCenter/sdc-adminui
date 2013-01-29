define(function(require) {
    var Backbone = require('backbone');
    var Jobs = Backbone.Collection.extend({
        url: '/_/jobs'
    });

    return Jobs;
});