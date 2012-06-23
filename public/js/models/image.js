var Image = module.exports = Backbone.Model.extend({
  urlRoot:'/_/images',
  idAttribute: 'uuid',
  defaults: {
    'name':null
  },
  nameWithVersion: function() {
    var name = this.get('name');
    var version = this.get('version');
    return [name, version].join(' ')
  },
  toJSON: function() {
    var attrs = this.attributes;
    attrs.files = _.map(attrs.files, function(f) {
      if (f.size) {
        f.size_in_mb = _sizeToMB(f.size);
      }
      return f;
    });
    return attrs;
  }
});

function _sizeToMB(size) {
  return _.str.sprintf('%0.1f', size / 1024 / 1024);
}
