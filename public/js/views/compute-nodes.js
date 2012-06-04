/**
 * views/servers.js
*/

var BaseView = require('views/base');
var ComputeNodes = require('models/compute-nodes');

var ComputeNodesListItem = BaseView.extend({
  template: 'compute-nodes-list-item',
  render: function() {
    this.setElement(this.template(this.model.attributes));
    return this;
  }
});

var ComputeNodesList = BaseView.extend({
  initialize: function() {
    _.bindAll(this, 'addOne', 'addAll');

    this.collection.bind('all', this.addAll);
    this.collection.fetch();
  },
  addOne: function(cn) {
    var view = new ComputeNodesListItem({model:cn});
    this.$el.append(view.render().el);
  },
  addAll: function() {
    this.collection.each(this.addOne);
  },
  render: function() {
    return this;
  }
});

var ComputeNodesView = module.exports = BaseView.extend({
  name: 'compute-nodes',
  template: 'compute-nodes',
  initialize: function(options) {
    this.setElement(this.template());
    this.collection = new ComputeNodes();

    this.listView = new ComputeNodesList({
      collection: this.collection,
      el: this.$("tbody")
    });
  },
  render: function() {
    return this;
  }
});
