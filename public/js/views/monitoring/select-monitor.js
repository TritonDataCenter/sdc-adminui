var BaseView = require('views/base');

var SelectMonitorView = module.exports = BaseView.extend({
  template: 'select-monitor',

  render: function() {
    this.$el.html(this.template());
    return this;
  }

});
