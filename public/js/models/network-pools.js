var Backbone = require('backbone');
/*
    GET /network_pools/3b5913ec-42e6-4803-9c0b-c9b1c5603520
    {
      "uuid": "3b5913ec-42e6-4803-9c0b-c9b1c5603520",
      "name": "internal",
      "networks": [
        "0e70de36-a40b-4ac0-9429-819f5ff822bd",
        "9f2eada0-529b-4673-a377-c249f9240a12"
      ]
    }
*/

module.exports = Backbone.Collection.extend({
    url: "/_/network_pools"
});

