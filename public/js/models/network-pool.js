var Model = require('./model');

var NetworkPool = Model.extend({
    defaults: {
        "name": ""
    },
    urlRoot: "/_/network_pools",
    idAttribute: "uuid"
});
module.exports = NetworkPool;
