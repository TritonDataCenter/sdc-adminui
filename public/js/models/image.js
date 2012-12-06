define(['underscore', 'backbone'], function(_, Backbone) {
  'use strict';

  return Backbone.Model.extend({
    urlRoot:'/_/images',

    idAttribute: 'uuid',

    defaults: {
      'name':null
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

});
