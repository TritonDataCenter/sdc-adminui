var React = require('react');
var JSONView = React.createClass({
    getInitialState: function() {
        return {
            json: this.props.json || {}
        };
    },

    render: function() {
        var contents = JSON.stringify(this.state.json, null, 2);
        return <div className={this.props.className}>{contents}</div>;
    }
});


module.exports = JSONView;
