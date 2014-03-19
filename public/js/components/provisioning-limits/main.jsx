var React = require('react');
var Limits = require('../../models/limits');

var OS_VALUES = [
    "smartos",
    "linux",
    "windows",
    "bsd",
    "illumos",
    "other",
    "any"
]

var BY_LABELS = {
    "ram": "MB RAM",
    "quota": "GB DISK",
    "machines": "Machines"
}

var ProvisioningLimitsList = React.createClass({
    renderLimit: function(dclimit) {
        var dc = dclimit.datacenter;
        var limitsNodes = dclimit.limit.map(function(l) {
            l.by = l.by || l.limitby;
            var byLabel = BY_LABELS[l.by];
            console.log(l);
            // New PROVISIONING LIMITS plugin
            return (<div key={JSON.stringify(l)} className="limit">
                <div className={'check-criteria '+l.check}><strong>{l.check}</strong> {l[l.check]}</div>
                <div className="by-criteria"><strong><i className="icon icon-arrow-right"></i></strong><span className="value">{l.value}</span> {byLabel}</div>
            </div>)
        });

        return (<div key={dclimit.datacenter} className="limits-dc">
            <h5>{dclimit.datacenter}</h5>
            <div className="limits-dc-header">
                <div className="criteria-header">CRITERIA</div>
                <div className="limit-header">LIMIT</div>
            </div>
            {limitsNodes}
            </div>);
    },
    render: function() {
        return (
            <div className="provisioning-limits-list">
            { this.props.limits.map(this.renderLimit) }
            </div>
        )
    }
});

module.exports = ProvisioningLimits = React.createClass({
    propTypes: {
        user: React.PropTypes.string.isRequired
    },
    fetchLimits: function() {
        var collection = new Limits(null, {user: this.props.user });
        var req = collection.fetch()
        req.done(function(res) {
            this.setState({limits: res})
        }.bind(this));
    },
    componentWillMount: function() {
        this.fetchLimits();
    },
    getInitialState: function() {
        return {
            limits: []
        }
    },
    render: function() {
        return (
            <div className="provisioning-limits-component">
                <h3>Provisioning Limits</h3>
                <ProvisioningLimitsList limits={this.state.limits} />
            </div>
        );
    }
});
