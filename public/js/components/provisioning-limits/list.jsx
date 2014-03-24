var React = require('react');


var UNIT_LABELS = {
    "ram": "MB RAM",
    "quota": "GB DISK",
    "machines": "Machines"
}

/**
 * Properties

 * limits        array limits list
 * handleEdit       fn(limit) clicked Edit Button
 * handleDelete     fn(limit) clicked Delete Button
 */
var ProvisioningLimitsList = module.exports = React.createClass({
    propTypes: {
        handleEdit: React.PropTypes.func,
        handleDelete: React.PropTypes.func
    },
    getDefaultProps: function() {
        return {
            handleEdit: function() {},
            handleDelete: function() {}
        }
    },

    handleEdit: function(limit) {
        this.props.handleEdit(limit);
    },

    handleDelete: function(limit) {
        this.props.handleDelete(limit);
    },

    renderLimit: function(dclimit) {
        var dc = dclimit.datacenter;
        var limitsNodes;

        if (dclimit.limit.length === 0) {
            limitsNodes = [<div className="limit zero-state">This datacenter has no limits configured</div>];
        } else {
            limitsNodes = dclimit.limit.map(function(l) {
                l.datacenter = dclimit.datacenter;
                l.by = l.by;
                var byLabel = UNIT_LABELS[l.by];
                // New PROVISIONING LIMITS plugin
                return (
                    <div key={JSON.stringify(l)} className="limit">
                            { l[l.check] === 'any' ?
                                <div className="check-criteria.any">ANY</div>
                                :
                                <div className={'check-criteria '+l.check}><strong>{l.check}</strong> {l[l.check]}</div>
                            }
                        <div className="by-criteria">
                            <i className="icon icon-arrow-right"></i>
                            <span className="value">{l.value}</span>
                            <span className="unit">{byLabel}</span>
                        </div>
                        <div className="actions">
                            <a onClick={this.handleEdit.bind(this, l)} className="edit"><i className="icon icon-pencil"></i> Edit</a>
                            <a onClick={this.handleDelete.bind(this, l)} className="delete"><i className="icon icon-trash"></i> Delete</a>
                        </div>
                    </div>
                )
            }, this);
        }


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
                    ? this.props.limits.map(this.renderLimit, this)
                    : this.renderZeroState()
            }
            </div>
        )
    }
});
