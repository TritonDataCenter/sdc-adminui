/**
 * views/machines.js
*/

var Machines = Backbone.Collection.extend({
  url: "/machines"
});

var MachinesListItem = Backbone.View.extend({
  template: Handlebars.compile($("#template-machines-list-item").html()),
  render: function() {
    this.setElement(this.template(this.model.attributes));
    return this;
  }
});

var MachinesView = module.exports = Backbone.View.extend({
  name: 'machines',

  template: Handlebars.compile($("#template-compute-nodes").html()),

  initialize: function(options) {
    this.setElement(this.template());
    this.collection = new Machines();

    this.listView = new MachinesList({
      collection: this.collection,
      el: this.$('tbody')
    });
  },

  render: function() {
    return this;
  }
});

var MachinesList = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'addOne', 'addAll');

    this.collection.bind('all', this.addAll);
    this.collection.fetch();
  },
  addOne: function(machine) {
    var view = new MachinesListItem({model:machine});
    this.$el.append(view.render().el);
  },
  addAll: function() {
    this.collection.each(this.addOne);
  },
  render: function() {
    return this;
  }
});
