/** @jsx React.DOM **/

var React = require('react');

var NicConfigComponent = require('./nic-config');

var MultipleNicConfigComponent = module.exports = React.createClass({
    getValue: function() {
        return this.state.nics;
    },
    getInitialState: function() {
        var state = {};
        state.nics = this.props.nics || [];
        state.networkFilters = this.props.networkFilters || {};
        return state;
    },
    onNicPropertyChange: function(prop, value, nic, com) {
        if (prop === 'primary' && value === true) {
            var nics = this.state.nics;
            nics = _.map(nics, function(n) {
                if (n === nic) {
                    n.primary = true;
                } else {
                    n.primary = false;
                }
                return n;
            });
            this.setState({nics: nics});
        }
    },
    addNewNic: function() {
        var nics = this.state.nics;
        nics.push({});
        this.setState({nics: nics});
    },
    removeNic: function(nic) {
        var nics = _.without(this.state.nics, nic);
        this.setState({nics: nics});
    },
    render: function() {
        var nodes = _.map(this.state.nics, function(nic) {
            var component = <NicConfigComponent onChange={this.onNicPropertyChange} networkFilters={this.state.networkFilters} nic={nic} />;
            return <div className="nic-config-component-container">
                <div className="nic-config-action">
                    <a className="remove" onClick={this.removeNic.bind(this, nic)}>
                        <i className="icon icon-remove"></i> Remove
                    </a>
                </div>
                <div className="nic-config-component">{component}</div>
            </div>
        }, this);
        return <div className="multiple-nic-config-component">
            {nodes}
            <a className="attach-network-interface" onClick={this.addNewNic}>Attach Another NIC</a>
        </div>;
    }
});
