var Backbone = require('backbone');
var Image = require('./image');

module.exports = Backbone.Collection.extend({
    model: Image,
    url: '/_/images'
});
