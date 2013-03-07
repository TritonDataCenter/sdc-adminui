define(function(require) {
    var Image = require('models/image');

    return Backbone.Collection.extend({
        model: Image,
        url: '/_/images'
    });
});