var Backbone = require('backbone');

var Mainnav = Backbone.Marionette.ItemView.extend({
    events: {
        'click li[data-view]':'onSelect'
    },

    initialize: function(options) {
        this.vent = options.vent;
        this.listenTo(this.vent, 'mainnav:highlight', this.highlight, this);
    },

    onSelect: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return true;
        }

        e.preventDefault();
        var li = $(e.target).parent();
        var view = li.attr("data-view");
        this.highlight(view);
        this.vent.trigger("showview", view);
    },

    highlight: function(view) {
        this.$("li").removeClass('active');
        this.$("li i").removeClass("icon-white");

        var li = this.$('li[data-view='+view+']');

        li.addClass('active');
        li.find("i").addClass("icon-white");
    }
});

module.exports = Mainnav;
