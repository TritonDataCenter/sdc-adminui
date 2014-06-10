var Model = require('./model');

var NetworkPool = Model.extend({
    defaults: {
        "name": ""
    },
    urlRoot: "/api/network_pools",
    idAttribute: "uuid"
});
module.exports = NetworkPool;
