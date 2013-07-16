var Backbone = require('backbone');
var _ = require('underscore');

var View = module.exports = Backbone.Marionette.ItemView.extend({
    attributes: {
        'class': 'jobs-filter'
    },
    events: {
        'submit form': 'doQuery',
        'change select': 'doQuery',
        'keyup input': 'onQuery'
    },
    template: require('../tpl/jobs-filter.hbs'),
    initialize: function() {
        this.debouncedQuery = _.debounce(this.doQuery.bind(this), 300);
    },
    onQuery: function() {
        this.debouncedQuery();
        return false;
    },
    doQuery: function() {
        var params = Backbone.Syphon.serialize(this);
        _.each(params, function(value, key) {
            if (value.length === 0) {
                delete params[key]
            }
        });
        if (params.name) {
            params.name = params.name + "*";
        }
        this.trigger('query', params);
        return false;
    }
});
