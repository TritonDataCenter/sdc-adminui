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

        var close = $('<a><i class="icon-remove-sign"></i></a>');
        close.on('click', function() {
            node.slideUp(function() {
                node.remove();
            });
        });

        node.hide();

        this.$el.append(node);

        window.scrollTo(0, this.$el.offset().top);

        node.slideDown(function() {
            node.append(close);
        });

        if (! notification.persistent) {
            setTimeout(function() {
                node.slideUp(function() {
                    node.remove();
                });
            }, this.timeout);
        }
    }

});

module.exports = View;
