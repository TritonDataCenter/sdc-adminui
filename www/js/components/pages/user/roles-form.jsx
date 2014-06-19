var React = require('react');
var PropTypes = React.PropTypes;
var api = require('../../../request');
var _ = require('underscore');
var Chosen = require('react-chosen');

var UserRolesForm = React.createClass({
    propTypes: {
        account: PropTypes.string.isRequired,
        handleSaved: PropTypes.func,
        handleClose: PropTypes.func
    },
    componentWillMount: function() {
        this._fetchAccountPolicies();
    },
    getInitialState: function() {
        return {
            name: '',
            policies: [],
            selectedPolicies: [],
            selectPolicy: false,
            selectPolicyCurrent: {},
        };
    },
    _fetchAccountPolicies: function() {
        var url = _.str.sprintf('/api/users/%s/policies', this.props.account);
        api.get(url).end(function(res) {
            if (res.ok) {
                this.setState({policies: res.body});
            } else {
                alert('error fetching policies');
            }
        }.bind(this));
    },


    _enterSelectPolicyMode: function() {
        this.setState({selectPolicy: true});
    },

    _exitSelectPolicyMode: function() {
        this.setState({selectPolicy: false});
    },

    _onAddPolicy: function() {
        var selectedPolicies = _.clone(this.state.selectedPolicies);
        selectedPolicies.push(this.state.selectPolicyCurrent);
        this.setState({
            selectedPolicies: selectedPolicies,
            selectPolicyCurrent: {},
            selectPolicy: false
        });
    },

    _onChangeSelectedPolicy: function(e) {
        var v = e.target.value;
        var p = _.findWhere(this.state.policies, {uuid: v});
        console.log('selected policy', p);
        this.setState({selectPolicyCurrent: p});
    },

    _onNameChange: function(e) {
        this.setState({name: e.target.value});
    },

    _handleSaveRole: function(e) {
        e.preventDefault();

        var url = _.str.sprintf('/api/users/%s/roles', this.props.account);
        var payload = {};
        payload.name = this.state.name;
        payload.policies = this.state.selectedPolicies.map(function(p) {
            return p.uuid;
        });
        api.post(url).send(payload).end(function(res) {
            if (res.ok) {
                this.props.handleSaved(res.body);
            }
        }.bind(this));
    },

    _renderPolicySelect: function() {
        return (
            <div className="input-group">
                <Chosen data-placeholder="Select a Policy" onChange={this._onChangeSelectedPolicy}>
                    <option></option>
                {
                    this.state.policies.map(function(p) {
                        return <option key={p.uuid} value={p.uuid}>{p.name} - {p.description}</option>;
                    })
                }
                </Chosen>
                <span className="input-group-btn">
                    <button onClick={this._onAddPolicy} disabled={_.isEmpty(this.state.selectPolicyCurrent)} type="button" className="btn btn-info"><i className="fa fa-plus"></i></button>
                    <button onClick={this._exitSelectPolicyMode} type="button" className="btn btn-default"><i className="fa fa-times"></i></button>
                </span>
            </div>
        );
    },

    render: function() {
        var policies;
        if (!this.state.policies.length && !this.state.selectPolicy) {
            policies = <div className="policy empty">No Policies Selected</div>;
        } else {
            policies = this.state.selectedPolicies.map(function(p, i) {
                return <div key={i} className="policy row" data-index={i}>
                <div className="policy-name col-xs-4">{p.name}</div>
                <div className="policy-rules col-xs-8">
                    {p.rules.map(function(r, i) {
                        return <div key={i} className="policy-rule">{r}</div>;
                    })}
                </div>
                </div>;
            });
        }
        var policySelect = this.state.selectPolicy ? this._renderPolicySelect() : <button type="button" onClick={this._enterSelectPolicyMode} className="btn btn-link btn-sm"><i className="fa fa-plus" /> Add Existing Policy</button>;

        return <div className="panel user-roles-form">
            <div className="panel-body">
                <div className="panel-title">Create New Role</div>
                <form onSubmit={this._handleSaveRole} className="form form-horizontal">
                    <div className="form-group">
                        <label className="col-xs-2 control-label">Role Name</label>
                        <div className="controls col-xs-6">
                            <input value={this.state.name} onChange={this._onNameChange} type="text" className="form-control" />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="col-xs-offset-1 col-xs-7 role-policies-control">
                            <h6>Role Policies</h6>
                            <div className="role-policies">
                                { policies }
                                { policySelect }
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="col-xs-offset-1 col-xs-10">
                            <button disabled={! (this.state.selectedPolicies.length && this.state.name.length) } type="submit" className="btn btn-info">Save Role</button>
                            <button type="button" onClick={this.props.handleClose} className="btn btn-default">Cancel</button>
                        </div>
                    </div>

                </form>
            </div>
        </div>;
    }
});

module.exports = UserRolesForm;
