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
                error.errors && error.errors.length ? error.errors.map(function(err) {
                    return <div><strong>{err.field}</strong> - {err.message}</div>;
                }) : ''
            }
        </div>);
    }
});

module.exports = ErrorAlert;
