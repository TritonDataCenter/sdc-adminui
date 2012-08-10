var BaseView = require('views/base');

var View = BaseView.extend({

  template: 'monitoring-machine-up-probe',

  events: {
    'click button': 'done'
  },

  initialize: function(options) {
    _.bindAll(this);
    options = options || {};

    this.config = new Backbone.Model();
    this.config.set({
      agent: options.vm.get('uuid'),
      name: _.str.sprintf('machine-up-%s', options.vm.get('alias'))
    });
  },

  focus: function() {
    return this;
  },

  render: function() {
    this.$el.html(this.template(this.config.toJSON()));
    this.delegateEvents();

    return this;
  },

  done: function() {
    this.trigger('done', this.config.toJSON());
  },

  hide: function() {
    this.$el.modal('hide');
  }
});

module.exports = View;
