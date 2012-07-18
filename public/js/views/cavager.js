var BaseView = require('views/base');
var Cavager = BaseView.extend({
  template: 'cavager',
  initialize: function(options) {
    this.xhr = options.xhr;
    this.settings = options.settings;
  },
  render: function() {
    this.$el.html(this.template({
      xhr: this.xhr,
      settings: this.settings
    }));
    return this;
  }
});

module.exports = Cavager;
