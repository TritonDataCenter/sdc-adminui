var React = require('react');
var Limits = require('../../models/limits');
var ProvisioningLimitsForm = require('./form.jsx');
var adminui = require('../../adminui');
var OS_VALUES = require('./constants').OPERATING_SYSTEMS;

var BY_LABELS = {
    "ram": "MB RAM",
    "quota": "GB DISK",
    "machines": "Machines"
}

var Modal = React.createClass({
    getDefaultProps: function() {
        return {
            handleHidden: function() {},
            handleShown: function() {}
        }
    },
    componentDidMount: function() {
        $(this.getDOMNode()).modal();
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
            <div className="modal-body unstyled" style={ {overflow: 'visible' } }>{this.props.children}</div>
        </div>
    }
});

var ProvisioningLimitsList = React.createClass({
    renderLimit: function(dclimit) {
        var dc = dclimit.datacenter;
        var limitsNodes = dclimit.limit.map(function(l) {
            l.by = l.by || l.limitby;
            var byLabel = BY_LABELS[l.by];
            // New PROVISIONING LIMITS plugin
            return (
                <div key={JSON.stringify(l)} className="limit">
                    { l[l.check] === 'any' ?
                        <div className="check-criteria.any">ANY</div> :
                        <div className={'check-criteria '+l.check}><strong>{l.check}</strong> {l[l.check]}</div>
                    }
                    <div className="by-criteria"><i className="icon icon-arrow-right"></i> <span className="value">{l.value}</span> {byLabel}</div>
                </div>
            )
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
    renderZeroState: function() {
        return <div className="zero-state">This user does not have any provisioning limits.</div>
    },
    render: function() {
        return (
            <div className="provisioning-limits-list">
            {
                this.props.limits.length
                    ? this.props.limits.map(this.renderLimit)
                    : this.renderZeroState()
            }
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
            limits: [],
            form: false
        }
    },
    handleSaved: function() {
        if (this.state.form) {
            this.setState({form: false});
        }
        adminui.vent.trigger('notification', {
            message: 'Successfully saved limit.'
        });
        this.fetchLimits();
    },
    showNewLimitForm: function() {
        this.setState({form: true});
    },
    handleClose: function() {
        if (this.state.form) {
            this.setState({form: false});
        }
    },
    render: function() {
        return (
            <div className="provisioning-limits-component">
                { this.state.form ? <Modal handleHidden={this.handleClose} ref="modal"><ProvisioningLimitsForm
                    onSaved={this.handleSaved}
                    user={this.props.user} ref="form" /></Modal> : '' }
                <h3>Provisioning Limits
                    <div className="actions">
                        <button onClick={this.showNewLimitForm} className="btn btn-info"><i className="icon icon-plus-sign"></i> New Limit</button>
                    </div>
                </h3>
                <ProvisioningLimitsList limits={this.state.limits} />
            </div>
        );
    }
});
