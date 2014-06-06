var React = require('react');
var Backbone = require('backbone');
var adminui = require('../adminui');

var Region = Backbone.Marionette.Region.extend({
    el: '.bb'
});

var BBComponent = React.createClass({
    componentDidMount: function() {
        var view = this.props.view;

        this.region = new Region();
        this.region.show(view);

        if (typeof(view.sidebar) === 'string') {
            adminui.vent.trigger('mainnav:highlight', view.sidebar);
        } else {
            adminui.vent.trigger('mainnav:highlight', view.name);
        }
    },
    componentDidUpdate: function() {
        this.region.show(this.props.view);
    },

    componentWillUmount: function() {
        this.region.close();
    },

    render: function() {
        return React.DOM.div({className:'bb'});
    }
});

module.exports = BBComponent;
