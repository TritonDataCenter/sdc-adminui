define(function(require) {

    var AnalyticsView = Backbone.Marionette.ItemView.extend({
        template: require('text!tpl/analytics.html'),
        url: '/analytics',
        sidebar: 'analytics',
        onShow: function() {
            console.log("VisContainer", $("#visContainer"));
            this.$el.append('<script language="javascript" type="text/javascript" src="/ca-vis/create.js"></script>');
        }
    });


    return AnalyticsView;

});