var React = require('react');
var Notifications = React.createClass({
    propTypes: {
        bus: React.PropTypes.object.isRequired
    },
    getInitialState: function() {
        return {notifications: []};
    },
    componentWillMount: function() {
        this.props.bus.on('notification', this.notify, this);
    },
    componentWillUnmount: function() {
        this.props.bus.off('notification', this.notify);
    },
    notify: function(n) {
        console.log("notify", n);
        var notifications = this.state.notifications;
        notifications.push(n);
        this.setState({notifications: notifications});
    },
    _handleDismissNotification: function(n) {
        var notifications = this.state.notifications;
        var newNotifications = _.without(notifications, n);
        this.setState({notifications: newNotifications});
    },
    render: function() {
        return <div id="notifications">
            {
                this.state.notifications.map(function(n) {
                    return <div className={'notification ' + (n.level || 'info')}> {n.message}
                        <a onClick={this._handleDismissNotification.bind(null, n)}><i className="fa fa-times"></i></a>
                    </div>
                }, this)
            }
        </div>
    }
});

module.exports = Notifications;
