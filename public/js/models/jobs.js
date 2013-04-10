var Backbone = require('backbone');
var Jobs = Backbone.Collection.extend({
    url: '/_/jobs'
});

module.exports = Jobs;