/**
 * views/machines.js
*/

var Vms = require('models/vms');
var BaseView = require('views/base');

var VmsListItem = BaseView.extend({
  template: 'vms-list-item',

  render: function() {
    this.setElement(this.template(this.model.attributes));
    return this;
  }
});

var VmsView = module.exports = BaseView.extend({
  name: 'vms',

  template: 'vms',

  appEvents: {
  },

  events: {
    'click .provision-button':'provision'
  },

  initialize: function(options) {
    this.setElement(this.template());
    this.collection = new Vms();

    this.listView = new VmsList({
      collection: this.collection,
      el: this.$('tbody')
    });
  },

  provision: function() {
    console.log("provision");
  },

  render: function() {
    return this;
  }
});

var VmsList = BaseView.extend({
  initialize: function() {
    _.bindAll(this, 'addOne', 'addAll');

    this.collection.bind('all', this.addAll);
    this.collection.fetch();
  },
  addOne: function(model) {
    var view = new VmsListItem({model:model});
    this.$el.append(view.render().el);
  },
  addAll: function() {
    this.collection.each(this.addOne);
  },
  render: function() {
    return this;
  }
});
