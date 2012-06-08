var Image = require('models/image');

var Images = module.exports = Backbone.Collection.extend({
  model: Image,

  url: '/_/images',

  parse: function(resp, xhr) {
    return resp;
  },

  groupBy: function(field, callback) {
    var values = _.unique(this.pluck(field));
    var grouped = _.map(values, function(v) {
      var filtered = this.filter(function(i) {
        return i.get(field) === v;
      });

      var collection = new Images(filtered);
      collection.groupedBy = collection.at(0).get(field);
      return collection;
    }, this);

    return _(grouped);
  },
});
