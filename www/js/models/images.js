var Collection = require('./collection');
var Img = require('./image');

module.exports = Collection.extend({
    model: Img,
    url: '/api/images'
});
