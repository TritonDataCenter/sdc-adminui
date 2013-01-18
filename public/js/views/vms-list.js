define(function(require) {

  var ItemTemplate = require('tpl!vms-list-item');
  var adminui = require('adminui');

  var ItemView = Marionette.ItemView.extend({
    tagName: 'tr',
    template: ItemTemplate,

    events: {'click .alias a': 'navigateToVmDetails'},

    initialize: function() {
      _.bindAll(this);
    },

    navigateToVmDetails: function() {
      adminui.vent.trigger('showview', 'vm', {vm:this.model});
    }
  });

  return Backbone.Marionette.CollectionView.extend({
    itemView: ItemView
  });
});
