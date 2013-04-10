var Backbone = require('backbone');
var BaseView = require('../base');

var ProbeSelection = BaseView.extend({
    template: 'probe-selection',

    initialize: function(options) {
        this.config = {};
    },

    render: function() {
        this.$el.html(this.template());
        return this;
    }
});

module.exports = ProbeSelection;