"use strict";
var React = require('react');
var ErrorAlert =  React.createClass({
    propTypes: {
        error: React.PropTypes.object
    },
    render: function() {
        var error = this.props.error;

        if (!error || !error.code) {
            return <div className="error-alert alert alert-danger" style={ {display: 'none'} }></div>;
        }

        return (<div className="error-alert alert alert-danger">
            {
                error.message ? <div><strong>{error.message}</strong></div>: ''
            }
            {
                error.errors && error.errors.length ? <ul>{error.errors.map(function(err) {
                    return <li><strong>{err.field}</strong> - {err.message}</li>;
                }) }</ul> : ''
            }
        </div>);
    }
});

module.exports = ErrorAlert;
