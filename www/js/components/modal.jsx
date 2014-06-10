var React = require('react');

var Modal = module.exports = React.createClass({
    getDefaultProps: function() {
        return {
            handleHidden: function() {},
            handleShown: function() {}
        }
    },
    componentDidMount: function() {
        $(this.getDOMNode()).modal({keyboard: false});
        $(this.getDOMNode()).on('hidden', this.props.handleHidden);
        $(this.getDOMNode()).on('shown', this.props.handleShown);
    },
    componentWillUnmount: function() {
        $(this.getDOMNode()).modal('hide');
        $(this.getDOMNode()).off('hidden', this.props.handleHidden);
        $(this.getDOMNode()).off('shown', this.props.handleShown);
    },
    close: function() {
        $(this.getDOMNode()).modal('hide');
    },
    open: function() {
        $(this.getDOMNode()).modal('show');
    },
    render: function() {
        return <div ref="modal" className="modal">
            <div className="modal-dialog">
                <div className="modal-content">
                    { this.props.children }
                </div>
            </div>
        </div>;
    }
});
