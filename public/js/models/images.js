var Image = require('models/image');

var Images = module.exports = new (Backbone.Collection.extend({
  model: Image,

  url: '/imglib/datasets',

  groupBy: function(field, callback) {
    var values = _.unique(this.pluck(field));
    var grouped = _.map(values, function(v) {
      var filtered = this.filter(function(i) {
        return i.get(field) === v;
      });

      var collection = new Backbone.Collection(filtered);
      collection.groupedBy = collection.at(0).get(field);
      return collection;
    }, this);

    return callback(_(grouped));
  },
}));
