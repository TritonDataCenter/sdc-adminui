var BaseView = require('views/base');

var MonitoringView = BaseView.extend({
  template: 'monitoring',

  name: 'monitoring',

  uri: function() {
    return 'monitoring'
  },

  render: function() {
    this.$el.html(this.template());
  }
});

module.exports = MonitoringView;
