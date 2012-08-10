/**
 * views/vms.js
*/
var BaseView = require('views/base');

var Vms = require('models/vms');
var VmsList = require('views/vms-list');


var VmsView = module.exports = BaseView.extend({
  name: 'vms',

  template: 'vms',

  url: function() {
    return 'vms'
  },

  events: {
    'click .provision-button':'provision'
  },

  initialize: function(options) {
    this.collection = new Vms();
    this.listView = new VmsList({ collection: this.collection });
  },

  provision: function() {
    this.eventBus.trigger('wants-view', 'provision-vm', {});
  },

  render: function() {
    this.$el.html(this.template());

    this.listView.setElement(this.$('tbody')).render();

    return this;
  }
});
