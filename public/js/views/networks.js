define(function(require) {

  var Networks = require('models/networks');

  var NetworksTemplate = require('text!tpl/networks.html');
  var NetworksListItemTemplate = require('text!tpl/networks-list-item.html');

  var NetworksListItem = Backbone.Marionette.ItemView.extend({
    template: NetworksListItemTemplate,
    tagName: 'tr'
  });

  var NetworksView = Backbone.Marionette.CompositeView.extend({
    name: "networks",
    
    template: NetworksTemplate,

    itemViewContainer: 'tbody',

    itemView: NetworksListItem,

    initialize: function(options) {
      this.collection = new Networks();
      this.collection.fetch();
    }
  });

  return NetworksView;
});