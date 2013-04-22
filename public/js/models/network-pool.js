var Backbone = require('backbone');
var NetworkPool = Backbone.Model.extend({
    defaults: {
        "name": ""
    },
    urlRoot: "/_/network_pools",
    idAttribute: "uuid"
});
module.exports = NetworkPool;
