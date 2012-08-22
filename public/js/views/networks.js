define(function(require) {

  var Networks = require('models/networks');
  var BaseView = require('views/base');

  var NetworksList = BaseView.extend({
    initialize: function() {
      _.bindAll(this, 'addOne', 'addAll');

      this.collection.bind('all', this.addAll);
      this.collection.fetch();
    },

    addOne: function(model) {
      var view = new NetworksListItem({ model:model });
      this.$el.append(view.render().el);
      console.log(this.$el);
    },

    addAll: function() {
      this.collection.each(this.addOne);
    },

    render: function() {
      return this;
    }
  });

  var NetworksView = BaseView.extend({
    name: "networks",
    template: 'networks',
    initialize: function(options) {

      this.collection = new Networks();

      this.listView = new NetworksList({ collection: this.collection });
    },

    render: function() {
      this.$el.html(this.template());
      this.listView.setElement(this.$('tbody')).render();
      return this;
    }
  });

  var NetworksListItem = BaseView.extend({
    template: 'networks-list-item',
    render: function() {
      this.setElement(this.template(this.model.attributes));
      return this;
    }
  });

  return NetworksView;
});