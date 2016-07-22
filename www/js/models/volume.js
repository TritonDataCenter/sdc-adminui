'use strict';

var Model = require('./model');

module.exports = Model.extend({
    urlRoot: '/api/volumes',
    idAttribute: 'uuid'
});
