'use strict';

var Volume = require('./volume');
var PageableCollection = require('./pageableCollection');

module.exports = PageableCollection.extend({
    model: Volume,
    url: '/api/volumes'
});
