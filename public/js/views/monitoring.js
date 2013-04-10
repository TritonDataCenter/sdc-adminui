var Backbone = require('backbone');
var BaseView = require('./base');

var MonitoringView = BaseView.extend({
    template: 'monitoring',

    name: 'monitoring',

    url: function() {
        return 'monitoring';
    },

    render: function() {
        this.$el.html(this.template());
    }
});

module.exports = MonitoringView;