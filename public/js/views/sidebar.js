define(function(require) {
  'use strict'

  var _ = require('underscore'),
    Backbone = require('backbone');

  var SidebarView = Backbone.View.extend({
    events: {
      'click li':'onSelect'
    },

    onSelect: function(e) {
      e.preventDefault();
      var li = $(e.currentTarget);
      var viewToHighlight = li.attr("data-view");
      this.highlight(viewToHighlight);

      this.trigger("sidebar:selected", viewToHighlight, this);
    },

    highlight: function(view) {
      this.$("li").removeClass('active');
      this.$("li i").removeClass("icon-white");

      var li = this.$('li[data-view='+view+']');

      li.addClass('active');
      li.find("i").addClass("icon-white");
    }
  });

  return SidebarView;
});

