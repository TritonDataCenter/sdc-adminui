define(function(require) {
  var ItemTemplate = require('text!tpl/vms-list-item.html');
  var adminui = require('adminui');

  return Marionette.ItemView.extend({
    tagName: 'tr',
    template: ItemTemplate,

    events: {'click *': 'navigateToVmDetails'},

    initialize: function() {
      _.bindAll(this);
    },

    uri: function() {
      return 'vms';
    },

    navigateToVmDetails: function() {
      adminui.vent.trigger('showview', 'vm', {vm:this.model});
    }
  });
});