var React = require('react');
var request = require('../../../request');

var EventsPage = React.createClass({
    statics: {
        sidebar: 'events',
        url: function(props) {
            return '/events';
        }
    },
    getInitialState: function() {
        return {
            requestId: null
        };
    },
    componentWillMount: function() {
        var self = this;
        request.get('/api/page-events/index').end(function(res) {
            if (res.ok) {
                self.setState(res.body);
            }
        });
    },
    render: function() {
        return <div id="page-events">
            <div className="page-header">
                <h2>SmartDataCenter Events</h2>
            </div>

            <div className="row">
                <div className="col-sm-12">
                    <div className="input-group">
                        <input type="text" ref="input" defaultValue={this.state.requestId} className="form-control" placeholder="Request ID" />
                        <span className="input-group-btn">
                            <button onClick={this._handleChangeRequestId} className="btn btn-info"><i className="fa fa-search"></i> Lookup Request</button>
                        </span>
                    </div>
                </div>
            </div>


        </div>;
    },
    _handleChangeRequestId: function() {
        this.setState({requestId: this.refs.input.getDOMNode().value});
    }
});

module.exports = EventsPage;
