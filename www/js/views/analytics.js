var Backbone = require('backbone');



var AnalyticsView = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/analytics.hbs'),
    url: '/analytics',
    sidebar: 'analytics',
    onShow: function() {
        console.log("VisContainer", $("#visContainer"));
        this.$el.append('<script language="javascript" type="text/javascript" src="/ca-vis/create.js"></script>');
    }
});


module.exports = AnalyticsView;

