var React = require('react');
var PropTypes = React.PropTypes;

var api = require('../../../request');

var UserPolicyForm = React.createClass({
    propTypes: {
        handleSavePolicy: PropTypes.func.isRequired,
        handleCancel: PropTypes.func,
        error: PropTypes.object
    },
    getDefaultProps: function() {
        return {
            handleCancel: function() {},
            error: null
        };
    },
    getInitialState: function() {
        return {
            rules: ['']
        };
    },
    render: function() {
        return (
            <div className="panel">
                <div className="panel-body">
                { this.props.error && <div className="alert alert-danger">{this.props.error.message}</div> }
                <form className="form form-horizontal" onSubmit={this._handleSubmit}>
                    <div className="form-group">
                        <div className="control-label col-sm-4">Policy Name</div>
                        <div className="controls col-sm-6">
                            <input type="text" placeholder="name of account policy" onChange={this._handleChangeName} value={this.state.name} className="form-control" />
                        </div>
                    </div>

                   <div className="form-group">
                        <div className="control-label col-sm-4">Policy Description</div>
                        <div className="controls col-sm-6">
                            <input type="text" placeholder="describe this policy" onChange={this._handleChangeDescription} value={this.state.description} name="name" className="form-control" />
                        </div>
                    </div>

                   <div className="form-group">
                        <div className="control-label col-sm-4">Rules</div>
                        <div className="controls col-sm-6">
                            {
                                this.state.rules.map(function(r, i) {
                                    return <div key={i} className="input-group">
                                        <input className="form-control" type="text" key={i} onChange={this._handleChangeRule} value={r} data-index={i} />
                                        <div className="input-group-btn">
                                        <button type="button" className="btn btn-link" data-index={i} onClick={this._handleRemoveRule}><i className="fa fa-times"></i></button>
                                        </div>
                                    </div>;
                                }, this)
                            }
                            <button type="button" onClick={this._handleAddAnotherRule} className="btn btn-link"><i className="fa fa-plus" /> Add another rule</button>
                        </div>
                    </div>
                    <div className="form-group">
                        <div className="input-group col-sm-offset-4 col-sm-6">
                            <button type="submit" onClick={this._handleSubmit} className="btn btn-primary">Save Policy</button>
                            <button type="button" onClick={this._handleCancel} className="btn btn-default">Cancel</button>
                        </div>
                    </div>
                </form>
                </div>
            </div>
        );
    },
    _handleCancel: function() {
        this.props.handleCancel();
    },
    _handleRemoveRule: function(e) {
        e.preventDefault();
        var i = e.target.getAttribute('data-index');
        if (i > -1)  {
            var rules = this.state.rules;
            rules = rules.splice(i, 1);
            console.log(i, rules);
            this.setState({rules: rules});
        }
    },
    _handleSubmit: function(e) {
        e.preventDefault();
        var policy = this.state;
        this.props.handleSavePolicy(policy);
    },
    _handleChangeRule: function(e) {
        var r = e.target.value;
        var i = e.target.getAttribute('data-index');
        var rules = this.state.rules;
        rules[i] = r;
        this.setState({rules: rules});
    },
    _handleChangeName: function(e) {
        var n = e.target.value;
        this.setState({name: n});
    },
    _handleChangeDescription: function(e) {
        var d = e.target.value;
        this.setState({description: d});
    },
    _handleAddAnotherRule: function(e) {
        e.preventDefault();
        var rules = this.state.rules;
        rules.push('');
        this.setState({rules: rules});
    }
});

var UserPolicies = React.createClass({
    propTypes: {
        account: PropTypes.string.isRequired
    },
    getInitialState: function() {
        return {
            policies: [],
            policyForm: false
        };
    },
    componentWillMount: function() {
        this._fetchPolicies();
    },
    _policiesApiUrl: function() {
        return _.str.sprintf('/api/users/%s/policies', this.props.account);
    },
    _handleSavePolicy: function(policy) {
        var p = _.clone(policy);
        p.rule = p.rules;
        delete p.rules;
        api.post(this._policiesApiUrl()).send(p).end(function(res) {
            if (res.ok) {
                this.setState({
                    policyFormError: null,
                    policyForm: false
                });
                console.log('success create policy', res.body);
                this._fetchPolicies();
            } else {
                console.log(res.error, res.body);
                this.setState({policyFormError: res.body});
            }
        }.bind(this));
    },
    _fetchPolicies: function() {
        this.setState({loading: true});
        api.get(this._policiesApiUrl()).end(function(res) {
            if (res.ok) {
                var policies = res.body.map(function(p) {
                    if (typeof(p.rule) === 'string') {
                        p.rules = [p.rule];
                    } else {
                        p.rules = p.rule;
                    }
                    return p;
                });

                this.setState({
                    loading: false,
                    policies: res.body
                });
            }
        }.bind(this));
    },
    renderPolicy: function(p) {
        return <div key={p.uuid} className="panel policy">
            <div className="panel-body">
                <div className="row">
                    <div className="col-sm-2">
                        <div className="name">{p.name}</div>
                    </div>
                    <div className="col-sm-4">
                        <div className="description">{p.description}</div>
                    </div>
                    <div className="col-sm-6">
                        {
                            p.rules.map(function(r) {
                                return <div key={r} className="rule"><span className="r">{r}</span></div>;
                            })
                        }
                    </div>
                </div>
            </div>
        </div>;
    },
    renderPolicies: function() {
         if (this.state.policies.length) {
            return this.state.policies.map(this.renderPolicy, this);
        } else {
            return <div className="no-policies panel"><div className="panel-body">No Account Policies Found</div></div>;
        }
    },
    render: function() {
        return (
        <div className="user-policies">
            <h3>Policies
                <div className="actions">
                    {
                        !this.state.policyForm &&
                        <button onClick={this._handleNewPolicy} className="btn btn-info"><i className="fa fa-plus"/> New Policy</button>
                    }
                </div>
            </h3>
            { this.state.policyForm && <UserPolicyForm
                error={this.state.policyFormError}
                handleCancel={this._handleCancelNewPolicy}
                handleSavePolicy={this._handleSavePolicy} /> }
            <div className="policies">
                {
                    this.state.loading ?
                        (<div className="panel">
                            <div className="panel-body">
                                <div className="loading-policies">Fetching Account Policies</div>
                            </div>
                        </div>) :
                        this.renderPolicies()
                }
            </div>
        </div>);
    },
    _handleCancelNewPolicy: function() {
        this.setState({policyForm: false});
    },
    _handleNewPolicy: function() {
        this.setState({policyForm: true});
    }

});

module.exports = UserPolicies;
