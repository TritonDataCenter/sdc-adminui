/** @jsx React.DOM */

var adminui = require('adminui');

var React = require('react');
var NicTags = require('../models/nictags');

var NicTagsList = React.createClass({
    getInitialState: function() {
        return {
            data: []
        };
    },
    componentWillMount: function() {
        var nicTags = new NicTags();
        var self = this;
        var promise = nicTags.fetch();
        $.when(promise).then(function() {
            self.setState({data: nicTags});
        });
    },
    onClick: function(nictag) {
        adminui.vent.trigger('showview', 'nictag', { model: nictag });
        return false;
    },
    render: function() {
        var nodes = this.state.data.map(function(nictag) {
            var nc = nictag.toJSON();
            var url = "/nictags/" + nc.name;
            return (
                <li key={nc.name}>
                <a onClick={this.onClick.bind(this, nictag)} data-uuid={nc.name} href={url}>{nc.name}</a>
                </li>
                );
        }, this);
        return (<div className="nictags-component"><ul>{nodes}</ul></div>);
    }
});


module.exports = Backbone.Marionette.View.extend({
    sidebar: 'networking',
    onShow: function() {
        React.renderComponent(
        <div className="nic-tags">
            <h4>Nic Tags</h4>
            <NicTagsList />
        </div>
        , this.$el.get(0));
        return this;
    }
})

