var Backbone = require('backbone');
var app = require('../adminui');

var Mainnav = Backbone.Marionette.ItemView.extend({
    events: {
        'click li[data-view]':'onSelect'
    },

    initialize: function() {
        this.listenTo(app.vent, 'mainnav:highlight', this.highlight, this);
    },

    onSelect: function(e) {
        e.preventDefault();

        var li = $(e.currentTarget);
        var view = li.attr("data-view");
        this.highlight(view);

        app.vent.trigger("showview", view);
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
