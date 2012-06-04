/**
 * views/machines.js
*/

var Machines = require('models/vms');
var BaseView = require('views/base');

var MachinesListItem = BaseView.extend({
  template: 'vms-list-item',

  render: function() {
    this.setElement(this.template(this.model.attributes));
    return this;
  }
});

var MachinesView = module.exports = BaseView.extend({
  name: 'machines',

  template: 'vms',

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

var MachinesList = BaseView.extend({
  initialize: function() {
    _.bindAll(this, 'addOne', 'addAll');

    this.collection.bind('all', this.addAll);
    this.collection.fetch();
  },
  addOne: function(model) {
    var view = new MachinesListItem({model:model});
    this.$el.append(view.render().el);
  },
  addAll: function() {
    this.collection.each(this.addOne);
  },
  render: function() {
    return this;
  }
});
