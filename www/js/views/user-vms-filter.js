var Backbone = require('backbone');
var React = require('react');
var _ = require('underscore');

var PackageSelect = require('../components/package-select.jsx');

var UserVmsFilter = Backbone.Marionette.ItemView.extend({
    attributes: {
        'class': 'vms-filter'
    },
    template: require('../tpl/user-vms-filter.hbs'),
    events: {
        'submit form': 'onSubmit'
    },
    onSubmit: function(e) {
        e.preventDefault();

        var data = Backbone.Syphon.serialize(this);
        _.each(data, function(v, k) {
            if (typeof(data[k]) === 'string' && data[k].length === 0) {
                delete data[k];
            }
        });
        this.trigger('query', data);
    },
    onRender: function() {
        React.renderComponent(
            new PackageSelect({}),
            this.$('.package-select').get(0)
        );
    }
});

module.exports = UserVmsFilter;
