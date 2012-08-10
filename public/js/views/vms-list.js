var VmsListItem = require('views/vms-list-item');

var BaseView = require('views/base');

var VmsList = module.exports = BaseView.extend({
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
