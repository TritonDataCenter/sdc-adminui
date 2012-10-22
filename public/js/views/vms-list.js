define([
  'underscore',
  'views/base',
  'models/vms',
  'views/vms-list-item'
], function(_, BaseView, Vms, VmsListItem) {

  'use strict';

  return Backbone.Marionette.CollectionView.extend({
    itemView: VmsListItem
  });
});
