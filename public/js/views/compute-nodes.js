/**
 * views/servers.js
*/

var ComputeNodes = Backbone.Collection.extend({
  url: "/servers"
});

var ComputeNodesListItem = Backbone.View.extend({
  template: Handlebars.compile($("#template-compute-nodes-list-item").html()),
  render: function() {
    this.setElement(this.template(this.model.attributes));
    return this;
  }
});

var ComputeNodesList = Backbone.View.extend({
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

var ComputeNodesView = module.exports = Backbone.View.extend({
  name: 'compute-nodes',
  template: Handlebars.compile($("#template-compute-nodes").html()),
  initialize: function(options) {
    this.setElement(this.template());
    this.collection = new ComputeNodes();

    this.listView = new ComputeNodesList({
      collection: this.collection,
      el: this.$("#compute-nodes-list tbody")
    });
  },
  render: function() {
    return this;
  }
});
