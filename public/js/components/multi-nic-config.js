/** @jsx React.DOM **/

var React = require('react');

var NicConfigComponent = require('./nic-config');

var MultipleNicConfigComponent = module.exports = React.createClass({
    propTypes: {
        nics: React.PropTypes.array,
        networkFilters: React.PropTypes.object,
        expandAntispoofOptions: React.PropTypes.bool,
        onChange: React.PropTypes.func
    },
    getValue: function() {
        return this.state.nics;
    },
    getDefaultProps: function() {
        return {
            expandAntispoofOptions: false,
            networkFilters: {},
            nics: []
        }
    },
    getInitialState: function() {
        var state = {};
        state.nics = this.props.nics || [];
        return state;
    },
    onNicPropertyChange: function(prop, value, nic, com) {
        console.info('onNicPropertyChange', prop, value, nic);
        var nics = this.state.nics;
        if (prop === 'primary' && value === true) {
            nics = _.map(nics, function(n) {
                if (n === nic) {
                    n.primary = true;
                } else {
                    n.primary = false;
                }
                return n;
            });
        }
        this.setState({nics: nics});
        this.props.onChange(nics);
    },
    addNewNic: function() {
        var nics = this.state.nics;
        nics.push({});
        this.setState({nics: nics});
    },
    removeNic: function(nic) {
        var nics = _.without(this.state.nics, nic);
        if (nics.length === 1) {
            nics[0].primary = true;
        }
        this.setState({nics: nics});
    },
    render: function() {
        var nodes = _.map(this.state.nics, function(nic) {
            return <div className="nic-config-component-container">
                <div className="nic-config-action">
                    <a className="remove" onClick={this.removeNic.bind(this, nic)}>
                        <i className="fa fa-trash-o"></i> Remove
                    </a>
                </div>
                <div className="nic-config-component">
                    <NicConfigComponent
                        expandAntispoofOptions={this.props.expandAntispoofOptions}
                        onPropertyChange={this.onNicPropertyChange}
                        networkFilters={this.props.networkFilters}
                        nic={nic} />
                </div>
            </div>
        }, this);

        return <div className="multiple-nic-config-component">
            {nodes}
            <a className="attach-network-interface" onClick={this.addNewNic}>Attach Another NIC</a>
        </div>;
    }
});
