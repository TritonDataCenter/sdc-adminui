define(['underscore', 'views/base', 'views/vms-list-item'], function(_, BaseView, VmsListItem) {
  'use strict';

  return BaseView.extend({
    initialize: function() {
      _.bindAll(this, 'addOne', 'addAll');

      this.collection.bind('all', this.addAll);
      this.collection.fetch();
    },

    addOne: function(model) {
      var view = new VmsListItem({ model: model });
      this.$el.append(view.render().el);
    },

    addAll: function() {
      this.collection.each(this.addOne);
    },

    render: function() {
      return this;
    }
  });
});