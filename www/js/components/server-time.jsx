var React = require('react');
var moment = require('moment');

var ServerTime = React.createClass({
    componentWillMount: function() {
        this._getTime();
    },
    componentDidMount: function() {
        this._interval = setInterval(this._getTime.bind(this), 1000);
    },
    _getTime: function() {
        this.setState({time: moment().utc().format("MMM D h:mm") });
    },
    render: function() {
        return <div id="server-time"><i className="fa fa-clock-o"></i> UTC <time>{this.state.time}</time></div>;
    },
    componentWillUnmount: function() {
        clearInterval(this._interval);
    }
});

module.exports = ServerTime;
