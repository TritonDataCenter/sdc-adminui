define(['views/base'], function(BaseView) {
  return BaseView.extend({
    template: 'monitoring-machine-up-probe',

    events: {
      'click button': 'done'
    },

    initialize: function(options) {
      _.bindAll(this);
      options = options || {};

      this.params = {
        type: 'machine-up',
        agent: options.vm.get('uuid'),
        name: _.str.sprintf('machine-up-%s', options.vm.get('alias'))
      };
    },

    focus: function() {
      return this;
    },

    render: function() {
      this.setElement(this.template());
      this.delegateEvents();

      return this;
    },

    done: function() {
      this.trigger('done', this.params);
    },

    hide: function() {
      this.$el.modal('hide');
    }
  });

});