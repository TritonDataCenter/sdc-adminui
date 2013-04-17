var Backbone = require('backbone');
var Job = require('./job');
var Jobs = Backbone.Collection.extend({
    model: Job,
    url: '/_/jobs'
});

module.exports = Jobs;
