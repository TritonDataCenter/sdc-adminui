define([
  'underscore',
  'views/base',
  'models/vms',
  'views/vms-list-item'
], function(_, BaseView, Vms, VmsListItem) {

  'use strict';

  return BaseView.extend({
    initialize: function(options) {
      _.bindAll(this, 'addOne', 'addAll');
      this.collection.bind('all', this.addAll);
      this.collection.fetch();
    },

    addOne: function(model) {
      var view = new VmsListItem({ model: model });
      console.log(view);
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
