/** @jsx React.DOM */

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
            self.setState({data: nicTags.toJSON()});
        });
    },
    render: function() {
        var listNodes = this.state.data.map(function(nictag) {
            var url = "/nictags/" + nictag.name;
            return (<li><a href={url}>{nictag.name}</a></li>);
        });
        return <div className="nictags-component"><ul>{listNodes}</ul></div>;
    }
});


module.exports = Backbone.Marionette.View.extend({
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

