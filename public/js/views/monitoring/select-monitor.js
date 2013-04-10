var Backbone = require('backbone');
var BaseView = require('../base');

var SelectMonitorView = BaseView.extend({
    template: 'select-monitor',

    render: function() {
        this.$el.html(this.template());
        return this;
    }

});

module.exports = SelectMonitorView;