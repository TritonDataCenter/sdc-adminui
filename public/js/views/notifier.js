var Backbone = require('backbone');

var View = Backbone.View.extend({
    initialize: function(options) {
        options = options || {};
        if (options.vent) {
            this.vent = options.vent;
            this.applyBindings();
        }
        this.timeout = options.timeout || 5000;
    },

    applyBindings: function() {
        this.listenTo(this.vent, 'notification', this.notify, this);
    },

    notify: function(notification) {
        var level = notification.level || 'info';

        var node = $("<div class='notification'></div>").addClass(level);
        node.html(notification.message);
        node.hide();

        this.$el.append(node);

        node.slideDown();
        setTimeout(function() {
            node.slideUp(function() {
                node.remove();
            });
        }, this.timeout);
    },
    _createNode: function(t) {
    }

});

module.exports = View;
