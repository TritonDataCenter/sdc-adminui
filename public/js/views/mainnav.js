define(function(require) {
    var app = require('adminui');
    var Marionette = require('backbone.marionette');

    var Mainnav = Marionette.ItemView.extend({
        events: {
            'click li[data-view]':'onSelect'
        },

        initialize: function() {
            this.bindTo(app.vent, 'mainnav:highlight', this.highlight, this);
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

    return Mainnav;
});