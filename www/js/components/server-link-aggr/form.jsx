/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Chosen = require('react-chosen');
var api = require('../../request');
var ErrorAlert = require('../error-alert.jsx');
var React = require('react');
var _ = require('underscore');

var LinkAggregationForm = React.createClass({
    propTypes: {
        server: React.PropTypes.string.isRequired,
        onSaved: React.PropTypes.func.isRequired,
        nics: React.PropTypes.array,
        initialLinkAggr: React.PropTypes.object
    },
    getInitialState: function () {
        var obj = {
            nictags: []
        };

        if (this.props.initialLinkAggr) {
            obj.linkAggr = this.props.initialLinkAggr;
        } else {
            obj.linkAggr = {
                name: '',
                macs: [],
                nic_tags_provided: [],
                lacp_mode: 'off'
            };
        }

        return obj;
    },
    componentWillMount: function () {
        api.get('/api/nic_tags')
            .end(function (err, res) {
                this.setState({nictags: res.body });
            }.bind(this));
    },
    componentDidMount: function () {
        this.refs.nameInput.getDOMNode().focus();
    },
    onChangeNicSelect: function (e) {
        var linkAggr = this.state.linkAggr;
        var originalMacs = this.state.linkAggr.macs;
        var mac = e.target.value;
        var macs;
        if (e.target.checked === true) {
            macs = originalMacs.concat(mac);
        } else {
            macs = _.without(originalMacs, mac);
        }
        linkAggr.macs = macs;
        this.setState({linkAggr: linkAggr});
    },
    onChangeName: function (e) {
        var linkAggr = this.state.linkAggr;
        linkAggr.name = e.target.value.replace(/[^a-zA-Z0-9]+$/g,'').toLowerCase();
        this.setState({linkAggr: linkAggr});
    },
    onChangeLacpMode: function (e) {
        var linkAggr = this.state.linkAggr;
        linkAggr.lacp_mode = e.target.value;
        this.setState({linkAggr: linkAggr});
    },
    onChangeNicTags: function (e, o) {
        var linkAggr = this.state.linkAggr;
        linkAggr.nic_tags_provided = linkAggr.nic_tags_provided || [];
        if (o.selected) {
            linkAggr.nic_tags_provided.push(o.selected);
        } else if (o.deselected) {
            linkAggr.nic_tags_provided = _.without(linkAggr.nic_tags_provided, o.deselected);
        }
        this.setState({linkAggr: linkAggr});
    },
    handleSubmit: function () {
        var req = this.state.linkAggr.id ?
            api.put('/api/linkaggrs/' + this.state.linkAggr.id) :
            api.post('/api/linkaggrs');

        req.send(this.state.linkAggr)
            .end(function (res) {
                if (res.ok) {
                    this.props.onSaved(res.body);
                } else {
                    console.error('Error creating link aggr', res);
                    this.setState({error: res.body});
                }
            }.bind(this));
    },
    isValid: function () {
        var linkAggr = this.state.linkAggr;
        return (
            (linkAggr.name.length) &&
            (linkAggr.macs.length >= 2) &&
            (linkAggr.lacp_mode));
    },

    render: function () {
        return (
            <div className="link-aggr-form">
            <div className="alert alert-warning"><strong>NOTE</strong> Any changes to Link Aggregations requires a reboot.</div>
            <ErrorAlert error={this.state.error} />
            <form onSubmit={this.handleSubmit} className="form-horizontal">
                <div className="form-group">
                    <label className="control-label col-sm-4">Name</label>
                    <div className="controls col-sm-8">
                        <input type="text" className="form-control" ref="nameInput" onChange={this.onChangeName}
                        value={this.state.linkAggr.name} placeholder="Example: aggr0" />
                    </div>
                </div>

                <div className="form-group">
                    <label className="control-label col-sm-4">Control Protocol Mode</label>
                    <div className="controls col-sm-8">
                        <select className="form-control" value={this.state.linkAggr.lacp_mode} onChange={this.onChangeLacpMode} name="lacp_mode">
                            <option value="off">off</option>
                            <option value="active">active</option>
                            <option value="passive">passive</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="control-label col-sm-4">NICs to aggregate</label>
                    <div className="controls col-sm-8">
                    <div className="nics">
                    {
                        this.props.nics.map(function (nic) {
                            var nicClasses = ['nic'];
                            var selected = this.state.linkAggr.macs.indexOf(nic.mac) !== -1;

                            if (selected) {
                                nicClasses.push('selected');
                            }
                            return (
                                <div className={'row ' + nicClasses.join(' ')} key={nic.mac}>
                                    <div className="col-xs-1"><input checked={selected} type="checkbox" onChange={this.onChangeNicSelect} value={nic.mac} /></div>
                                    <span className="col-xs-2 link-aggr-ifname">{nic.ifname}</span>
                                    <span className="col-xs-3 link-aggr-mac">{nic.mac}</span>
                                    <span className="col-xs-4 link-aggr-nictag">{nic.nic_tag}</span>
                                </div>
                            );
                        }, this)
                    }
                    </div>
                    </div>
                </div>

                <div className="form-group">
                    <label className="control-label col-sm-4">NIC Tags Provided</label>
                    <div className="controls col-sm-8">
                        <Chosen multiple="true" value={this.state.linkAggr.nic_tags_provided} onChange={this.onChangeNicTags}>
                        {
                            this.state.nictags.map(function (nictag) {
                                return <option>{nictag.name}</option>;
                            }, this)
                        }
                        </Chosen>
                    </div>
                </div>
            </form>
            <div className="pull-right">
                <button className="btn btn-link back" onClick={this.props.handleBack}>Back</button>
                <button className="btn btn-primary save"
                    disabled={ this.isValid() ? '' : 'disabled'}
                    onClick={this.handleSubmit}>Save Aggregation</button>
            </div>
            </div>
        );
    }
});


module.exports = LinkAggregationForm;
