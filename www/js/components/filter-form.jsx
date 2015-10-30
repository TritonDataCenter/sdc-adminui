/**
 * @jsx: React.DDM
 */
var React = require('react');
var _ = require('underscore');
var app = require('adminui');
var utils = require('../lib/utils');
var NicTags = require('../models/nictags');
var FabricVlans = require('../models/fabrics-vlans');
var INPUT_TYPES = {};

INPUT_TYPES.uuid = React.createClass({
    onChange: function (e) {
        this.props.onChange('uuid', e.target.value);
    },
    render: function () {
        return (<div className="form-group col-md-4">
            <label className="control-label">UUID</label>
            <input ref="input" value={this.props.value} onChange={this.onChange} className="form-control" type="text" name="uuid" placeholder="UUID" />
        </div>);
    }
});

INPUT_TYPES.alias = React.createClass({
    onChange: function(e) {
        this.props.onChange('alias', e.target.value);
    },
    render: function () {
        return (<div className="form-group col-md-3">
            <label className="control-label">Alias</label>
            <input ref="input" value={this.props.value} onChange={this.onChange} className="form-control" type="text" name="alias" placeholder="vm alias" />
        </div>);
    }
});

INPUT_TYPES.package_name = React.createClass({
    onChange: function (e) {
        this.props.onChange('package_name', e.target.value);
    },
    render: function () {
        return (<div className="form-group col-md-3">
            <label className="control-label">Package Name</label>
                <input ref="input" value={this.props.value} onChange={this.onChange} className="form-control" type="text" name="package_name" placeholder="Package Name" />
        </div>);
    }
});

INPUT_TYPES.name = React.createClass({
    onChange: function (e) {
        this.props.onChange('name', e.target.value);
    },
    render: function () {
        return (<div className="form-group col-md-3">
            <label className="control-label">Name</label>
            <input ref="input" value={this.props.value} onChange={this.onChange} className="form-control" type="text" name="name" placeholder="Name" />
        </div>);
    }
});


INPUT_TYPES.ip = React.createClass({
    onChange: function (e) {
        this.props.onChange('ip', e.target.value);
    },
    render: function () {
        return (<div className="form-group col-md-2">
            <label className="control-label">IP Address</label>
                <input ref="input" value={this.props.value} onChange={this.onChange} className="form-control" type="text" name="ip" placeholder="IP Address" />
        </div>);
    }
});

var TypeaheadUser = require('../views/typeahead-user');
INPUT_TYPES.owner_uuid = React.createClass({
    onSelectUser: function (user) {
        var uuid = null;
        if (user) {
            uuid = user.get && user.get('uuid') || user;
        }
        this.props.value = uuid;
        this.props.onChange('owner_uuid', uuid);
    },
    componentDidMount: function () {
        var node = this.refs.input.getDOMNode();
        this.typeahead = new TypeaheadUser({el: node, preSelectedUser: this.props.value});
        this.typeahead.on('selected', this.onSelectUser);
        this.typeahead.render();
    },
    componentDidUnmount: function () {
        this.typeahead.remove();
    },
    render: function () {
        return (<div className="form-group col-md-4">
            <label className="control-label">Owner UUID</label>
                <input ref="input" className="form-control" type="text" name="owner_uuid" placeholder="Search by login or uuid" />
        </div>);
    }
});

INPUT_TYPES.state = React.createClass({
    onChange: function (e) {
        this.props.onChange('state', e.target.value);
    },
    render: function () {
        return (<div className="form-group col-md-3">
            <label className="control-label">State</label>
                <select onChange={this.onChange} value={this.props.value} name="state" className="form-control">
                    <option value="">any</option>
                    <option value="provisioning">provisioning</option>
                    <option value="running">running</option>
                    <option value="stopped">stopped</option>
                    <option value="active">active</option>
                    <option value="failed">failed</option>
                    <option value="destroyed">destroyed</option>
                </select>
        </div>);
    }
});

INPUT_TYPES.nic_tag = React.createClass({
    getInitialState: function () {
        return {
            nictags: []
        };
    },
    onChange: function (e) {
        this.props.onChange('nic_tag', e.target.value);
    },
    componentWillMount: function () {
        var self = this;
        var nictags = new NicTags();
        nictags.fetch().done(function () {
            self.setState({nictags: nictags.toJSON()});
        });
    },
    render: function () {
        return (<div className="form-group col-md-2">
            <label className="control-label">NIC TAG</label>
                <select onChange={this.onChange} name="nic_tag" className="form-control">
                    <option value="">any</option>
                    { this.state.nictags.map(function (nictag) {
                        return (<option key={nictag.name} value={nictag.name}>{nictag.name}</option>)
                    }) }
                </select>
        </div>);
    }
});

INPUT_TYPES.vlan_id = React.createClass({
    getInitialState: function () {
        return {
            vlans: []
        };
    },
    onChange: function (e) {
        this.props.onChange('vlan_id', e.target.value);
    },
    componentWillMount: function () {
        this.vlans = new FabricVlans();
        this.setData(this.props.data);
    },
    componentWillReceiveProps: function (params) {
        if (params.data.owner_uuid !== this.props.data.owner_uuid) {
            this.setData(params.data);
        }
    },
    setData: function (params) {
        var self = this;
        this.vlans.params = params;
        this.vlans.fetch().done(function () {
            self.setState({vlans: self.vlans.toJSON()});
        });
    },
    render: function () {
        return (<div className="form-group col-md-2">
            <label className="control-label">VLAN</label>
            <select onChange={this.onChange} name="vlan" className="form-control" value={this.props.value}>
                <option value="">any</option>
                { this.state.vlans.map(function (vlan) {
                    return (<option key={vlan.vlan_id} value={vlan.vlan_id}>{vlan.name} ({vlan.vlan_id})</option>)
                }) }
            </select>
        </div>);
    }
});

var FilterForm = React.createClass({
    propTypes: {
        initialParams: React.PropTypes.object,
        handleSearch: React.PropTypes.func.isRequired
    },
    getInitialState: function () {
        return {
            values: this.props.initialParams || {},
            types: this.props.types || Object.keys(INPUT_TYPES),
            buttonTitle: this.props.buttonTitle || 'Search'
        };
    },
    _onChange: function (prop, value) {
        var values = this.state.values;
        values[prop] = value;
        this.setState({values: values});
    },
    renderFilterControls: function () {
        var self = this;
        return this.state.types.map(function (type) {
            var InputType = INPUT_TYPES[type];
            if (type === 'vlan_id' && !self.state.values.owner_uuid) {
                return;
            }
            if (InputType) {
                var value = this.state.values[type] || '';
                var data = type === 'vlan_id' ? {owner_uuid : self.state.values.owner_uuid} : null;
                return <InputType data={data} ref={type} key={type} onChange={self._onChange} value={value} />;
            }
            return;
        }, this);
    },
    render: function () {
        return <div className="panel panel-info">
            <div className="panel-heading">
                Search Options
            </div>
            <div className="panel-body">
                <form className="filter-options" onSubmit={this._onSubmit}>
                    <div className="row">
                    {this.renderFilterControls()}
                        <div className="form-group col-md-2">
                            <button type="submit" onClick={this._onSubmit} className="btn btn-sm btn-primary"><i className="fa fa-search"></i> {this.state.buttonTitle}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>;
    },
    _onSubmit: function (e) {
        e.preventDefault();
        var searchParams = utils.getVmSearchParams(this.state.values);
        app.router.changeSearch(searchParams);
        this.props.handleSearch(searchParams);
    }

});

module.exports = FilterForm;
