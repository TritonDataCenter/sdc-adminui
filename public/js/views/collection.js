var Backbone = require('backbone');

module.exports = Backbone.Marionette.CollectionView.extend({
    emptyView: require('./empty')
});
