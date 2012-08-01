'use strict'


var Sidebar = module.exports = Backbone.View.extend({
  template: Handlebars.compile($("#template-sidebar").html()),

  events: {
    'click li':'onSelect'
  },

  render: function() {
    this.$el.html(this.template());
  },

  onSelect: function(e) {
    e.preventDefault();

    var li = $(e.currentTarget);
    var view = li.attr("data-view");
    this.highlight(view);

    this.trigger("sidebar:selected", view, this);
  },

  highlight: function(view) {
    this.$("li").removeClass('active');
    this.$("li i").removeClass("icon-white");

    var li = this.$('li[data-view='+view+']');

    li.addClass('active');
    li.find("i").addClass("icon-white");
  }
});
