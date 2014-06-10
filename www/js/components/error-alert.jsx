var ErrorAlert = module.exports = React.createClass({
    propTypes: {
        error: React.PropTypes.object
    },
    render: function() {
        if ((!this.props.error) || this.props.error.length === 0) {
            return <div className="alert alert-error" style={ {display: 'none'} }></div>;
        }

        return (<div className="alert alert-error">
            {
                this.props.error.errors.map(function(err) {
                    return <div><strong>{err.field}</strong> - {err.message}</div>
                })
            }
        </div>)
    }
});
