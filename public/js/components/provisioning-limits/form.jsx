var React = require('react');
var Limits = require('../../models/limits');
var Chosen = require('react-chosen');
var Main = require('./main.jsx');

var Images = require('../../models/images');
var api = require('../../request');
var _ = require('underscore');

var OPERATING_SYSTEMS = require('./constants').OPERATING_SYSTEMS;
var DATACENTERS = require('./constants').DATACENTERS;

var Form = module.exports = React.createClass({
    propTypes: {
        user: React.PropTypes.string.isRequired,
        initialLimit: React.PropTypes.obj
    },
    getInitialState: function() {
        var state = {};
        if (this.props.initialLimit && this.props.initialLimit.check) {
            state = this.fromLimit(this.props.initialLimit);
        } else {
            this.props.initialLimit = null;
            state.limitUnit  = 'ram';
            state.criteriaType = 'any';
        }
        state.images = [];
        return state;
    },
    componentDidMount: function() {
        this.loadImages();
    },
    componentWillUnmount: function() {
        if (this.request) {
            this.request.abort();
        }
    },
    loadImages: function() {
        var collection = new Images([], {
            params: { repository: 'https://images.joyent.com' }
        });
        this.request = collection.fetch().done(function(images) {
            var imageNames = _.pluck(images, 'name');
            this.setState({images: _.unique(imageNames).sort() });
        }.bind(this))
    },
    handleChangeDatacenter: function(e) {
        this.setState({datacenter: e.target.value });
    },
    handleChangeCriteriaType: function(e, c) {
        this.setState({criteriaType: c.selected })
    },
    handleChangeCriteriaValue: function(e, c) {
        this.setState({criteriaValue: c.selected })
    },

    handleChangeLimitValue: function(e) {
        this.setState({limitValue: e.target.value });
    },

    handleChangeLimitUnit: function(e, c) {
        this.setState({limitUnit: c.selected });
    },

    fromLimit: function(limit) {
        var state = {};
        if (!limit.check || limit[limit.check] === 'any' || typeof(limit[limit.check]) === 'undefined') {
            state.criteriaType = 'any'
            state.criteriaValue = null;
        } else {
            state.criteriaType = limit.check;
            state.criteriaValue = limit[limit.check];
        }
        state.datacenter = limit.datacenter;
        state.limitUnit = limit.by;
        state.limitValue = limit.value;
        return state;
    },

    isValid: function() {
        var valid = (this.state.criteriaType && this.state.limitUnit && this.state.limitValue);
        if (this.state.criteriaType !== 'any' && (!this.state.criteriaValue || 0 === this.state.criteriaValue.length)) {
            valid = false;
        }
        console.log('validation', this.state, valid);

        return valid;
    },
    toLimit: function() {
        var state = this.state;
        var data = {};
        data.datacenter = state.datacenter;
        if (state.criteriaType === 'any') {
            data.check = 'os';
            data.os = 'any'
        } else {
            data.check = state.criteriaType;
            data[state.criteriaType] = state.criteriaValue;
        }
        data.by = state.limitUnit;
        data.value = state.limitValue;
        return data;
    },

    handleSave: function() {
        var limit = this.toLimit();
        var req;
        if (this.props.initialLimit) {
            req = api.patch(_.str.sprintf('/_/users/%s/limits/%s', this.props.user, limit.datacenter));
        } else {
            req = api.post(_.str.sprintf('/_/users/%s/limits/%s', this.props.user, limit.datacenter));
        }
        req.send(limit)
            .end(function(err, res) {
                if (res.ok) {
                    this.props.onSaved(res);
                }
            }.bind(this));
    },

    render: function() {
        return <div className="provisioning-limits-form">
            { this.props.initialLimit ? <h1>Update Limit for {this.props.initialLimit.datacenter}</h1> : <h1>Add New Limit</h1> }

            <form onSubmit={this.handleSave} className="form-horizontal">

                <div className="control-group">
                    <label className="control-label">Datacenter</label>
                    <div className="controls">
                        <Chosen placeholder="Select a Datacenter" value={this.state.datacenter} onChange={this.handleChangeDatacenter}>
                        <option value=""></option>
                        {
                            DATACENTERS.map(function(d) {
                                return <option value={d}>{d}</option>
                            })
                        }
                        </Chosen>
                    </div>
                </div>

                <div className="control-group">
                    <label className="control-label">Limit Provisions to</label>
                    <div className="controls">
                        <div className="input-append">
                            <input onChange={this.handleChangeLimitValue}
                                type="number"
                                value={this.state.limitValue}
                                style={ {width: 80} }
                                className="add-on" />

                            <Chosen onChange={this.handleChangeLimitUnit} value={this.state.limitUnit }>
                                <option value="ram">MB of RAM</option>
                                <option value="quota">GB of Disk Space</option>
                                <option value="machines">Virtual Machines</option>
                            </Chosen>
                        </div>
                    </div>
                </div>

                <div className="control-group">
                    <label className="control-label">For</label>
                    <div className="controls">
                    <div>
                        <Chosen value={this.state.criteriaType } onChange={ this.handleChangeCriteriaType }>
                            <option value="any">Any VM Type</option>
                            <option value="os">Operating System...</option>
                            <option value="image">Image...</option>
                        </Chosen>
                    </div>

                        { this.state.criteriaType === 'os' ?
                        <div>
                            <Chosen onChange={this.handleChangeCriteriaValue} value={this.state.criteriaValue}>
                            {
                                OPERATING_SYSTEMS.map(function(o) {
                                    return <option value={o}>{o}</option>
                                })
                            }
                            </Chosen>
                        </div>
                        : '' }

                        { this.state.criteriaType === 'image' ?
                        <div>
                            <Chosen onChange={this.handleChangeCriteriaValue} value={this.state.criteriaValue}>
                                    {
                                        this.state.images.map(function(i) {
                                            return <option value={i}>{i}</option>
                                        })
                                    }
                            </Chosen>
                            </div>
                        : '' }

                    </div>
                </div>

            </form>
            <div className="buttons">
                <button className="btn" data-dismiss="modal">Close</button>
                <button disabled={ this.isValid() ? '' : 'disabled' } onClick={this.handleSave} className="btn btn-primary" type="button">Save Limit</button>
            </div>
        </div>
    }
});
