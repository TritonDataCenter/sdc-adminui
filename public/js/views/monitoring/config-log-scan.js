var BaseView = require('views/base');

var View = BaseView.extend({

  template: 'monitoring-log-scan-probe',

  events: {
    'input input[name=threshold]': 'thresholdChanged',
    'input input[name=period]': 'periodChanged',
    'input input[name=regex]': 'regexChanged',
    'input input[name=path]': 'pathChanged',
    'input input[name=name]': 'nameChanged',
    'click button': 'done'
  },

  initialize: function(options) {
    _.bindAll(this);

    this.config = new Backbone.Model();
    this.config.set({
      period: 60,
      threshold: 1,
      path: '',
      regex: ''
    });
  },

  focus: function() {
    this.$el.find('input:first').focus();
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
  },

  pathChanged: function() {
    this.config.set('path', this.$('input[name=path]').val());
  },

  thresholdChanged: function() {
    this.config.set('threshold', this.$('input[name=threshold]').val());
  },

  periodChanged: function() {
    this.config.set('period', this.$('input[name=period]').val());
  },

  nameChanged: function() {
    this.config.set('name', this.$('input[name=name]').val());
  },

  regexChanged: function() {
    this.config.set('regex', this.$('input[name=regex]').val());
  }

});

module.exports = View;
