define(['views/base'], function(BaseView) {
  return BaseView.extend({
    template: 'vms-list-item',

    events: {'click *': 'navigateToVmDetails'},

    initialize: function() {
      _.bindAll(this);
    },

    uri: function() {
      return 'vms';
    },

    navigateToVmDetails: function() {
      this.eventBus.trigger('wants-view', 'vm', {vm:this.model});
    },

    render: function() {
      this.setElement(this.template(this.model.attributes));
      return this;
    }
  });
});