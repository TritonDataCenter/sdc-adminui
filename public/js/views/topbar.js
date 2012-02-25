define(function(require) {
  'use strict'

  var _ = require('underscore'),
    Backbone = require('backbone');

  return Backbone.View.extend({
    events: {
      'click a[data-trigger=signout]': 'signout'
    },
    initialize: function(options) {

    },
    signout: function() {
      this.trigger("signout");
    }
  });
})
