/**
 * @jsx: React.DDM
 */
var React = require('react');
var _ = require('underscore');
var app = require('adminui');
var utils = require('../../../lib/utils');

var INPUT_TYPES = {};

INPUT_TYPES.uuid = React.createClass({
    onChange: function (e) {
        this.props.onChange('uuid', e.target.value);
    },
    render: function () {
        return (<div className="form-group col-md-3">
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

INPUT_TYPES.ip = React.createClass({
    onChange: function (e) {
        this.props.onChange('ip', e.target.value);
    },
    render: function () {
        return (<div className="form-group col-md-3">
            <label className="control-label">IP Address</label>
                <input ref="input" value={this.props.value} onChange={this.onChange} className="form-control" type="text" name="ip" placeholder="IP Address" />
        </div>);
    }
});

var TypeaheadUser = require('../../../views/typeahead-user');
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
        return (<div className="form-group col-md-3">
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

var FilterForm = React.createClass({
    propTypes: {
        initialParams: React.PropTypes.object,
        handleSearch: React.PropTypes.func.isRequired
    },
    getInitialState: function () {
        return {
            values: this.props.initialParams
        };
    },
    _onChange: function (prop, value) {
        var values = this.state.values || {};
        values[prop] = value;
        this.setState({values: values});
    },
    renderFilterControls: function () {
        return Object.keys(INPUT_TYPES).map(function (type) {
            var TYPE = INPUT_TYPES[type];
            var value = this.state.values && this.state.values[type] || '';
            return <TYPE ref={type} key={type} onChange={this._onChange} value={value} />;
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
                        <div className="form-group col-md-3">
                            <button type="submit" onClick={this._onSubmit} className="btn btn-sm btn-primary"><i className="fa fa-search"></i> Search Virtual Machines</button>
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
