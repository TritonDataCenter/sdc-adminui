/** @jsx React.DOM **/
var React = require('react');
var Chosen = require('react-chosen');
var LinkAggrModel = require('../../models/linkaggr');
var _ = require('underscore');

var LinkAggregationsList = React.createClass({
    propTypes: {
        linkAggregations: React.PropTypes.array.required,
        onEdit: React.PropTypes.func,
        onDelete: React.PropTypes.func
    },
    render: function() {
        return (<div className="link-aggr-list">
        {
            this.props.linkAggregations.map(function(link) {
                return <div key={link.id} className="link-aggr">
                    <div className="link-aggr-name">{link.name}</div>
                    <div className="link-aggr-interfaces">
                    {
                        link.macs.map(function(mac) {
                            return <div key={mac} className="link-aggr-interface">
                                {mac}
                            </div>
                        }, this)
                    }
                    </div>
                    <div className="actions">
                        <button onClick={this.props.onEdit.bind(null, link)} className="btn btn-edit"><i className="icon-pencil"></i> Edit</button>
                        <button onClick={this.props.onDelete.bind(null, link)} className="btn btn-delete"><i className="icon-trash"></i> Delete</button>
                    </div>
                </div>
            }, this)
        }
        </div>);
    }
});



var NicTags = require('../../models/nictags');
var Nics = require('../../models/nics');
var LinkAggregationForm = React.createClass({
    propTypes: {
        server: React.PropTypes.string.required,
        initialLinkAggr: React.PropTypes.object
    },
    getInitialState: function() {
        var obj = {
            nictags: [],
            nics: []
        }

        if (this.props.initialLinkAggr) {
            obj.linkAggr = this.props.initialLinkAggr
        } else {
            obj.linkAggr = {
                name: '',
                macs: [],
                nic_tags_provided: [],
                lacp_mode: 'off'
            }
        }

        return obj;
    },
    componentWillMount: function() {
        this.nics = new Nics();
        this.nics.params = {belongs_to_uuid: this.props.server};
        this.nics.fetch().done(function() {
            this.setState({nics: this.nics });
        }.bind(this));

        this.nictags = new NicTags();
        this.nictags.fetch().done(function() {
            this.setState({nictags: this.nictags });
        }.bind(this));
    },
    componentDidMount: function() {
        this.refs.nameInput.getDOMNode().focus();
    },




    onChangeNicSelect: function(e) {
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
    onChangeName: function(e) {
        var linkAggr = this.state.linkAggr;
        linkAggr.name = e.target.value.replace(/[^a-zA-Z0-9]+$/g,'').toLowerCase();
        this.setState({linkAggr: linkAggr});
    },
    onChangeLacpMode: function(e) {
        var linkAggr = this.state.linkAggr;
        linkAggr.lacp_mode = e.target.value;
        this.setState({linkAggr: linkAggr});
    },
    onChangeNicTags: function(e, o) {
        var linkAggr = this.state.linkAggr;
        linkAggr.nic_tags_provided = linkAggr.nic_tags_provided || [];
        if (o.selected) {
            linkAggr.nic_tags_provided.push(o.selected);
        } else if (o.deselected) {
            linkAggr.nic_tags_provided = _.without(linkAggr.nic_tags_provided, o.deselected);
        }
        this.setState({linkAggr: linkAggr});
    },
    handleSubmit: function() {
        var linkAggregation = new LinkAggrModel(this.state.linkAggr);
        var result = linkAggregation.save(null, {success: this.props.handleSaved});
    },
    isValid: function() {
        var linkAggr = this.state.linkAggr;
        return (
            (linkAggr.name.length) &&
            (linkAggr.macs.length >= 2) &&
            (linkAggr.lacp_mode));
    },

    render: function() {
        return (
            <div className="link-aggr-form">
            <div className="alert"><strong>NOTE</strong> Any changes to Link Aggregations requires a reboot.</div>
            <form onSubmit={this.handleSubmit} className="form-horizontal">
                <div className="control-group">
                    <label className="control-label">Name</label>
                    <div className="controls">
                        <input type="text" ref="nameInput" onChange={this.onChangeName}
                        value={this.state.linkAggr.name} placeholder="Example: aggr0" />
                    </div>
                </div>

                <div className="control-group">
                    <label className="control-label">Control Protocol Mode</label>
                    <div className="controls">
                        <select value={this.state.linkAggr.lacp_mode} onChange={this.onChangeLacpMode} name="lacp_mode">
                            <option value="off">off</option>
                            <option value="active">active</option>
                            <option value="passive">passive</option>
                        </select>
                    </div>
                </div>

                <div className="control-group">
                    <label className="control-label">NICs to aggregate</label>
                    <div className="controls">
                    <div className="nics">
                    {
                        this.state.nics.map(function(nic) {
                            var nicClasses = ['nic'];
                            var selected = this.state.linkAggr.macs.indexOf(nic.get('mac')) !== -1

                            if (selected) {
                                nicClasses.push('selected');
                            }
                            return (
                                <div className={ nicClasses.join(' ')} key={nic.get('mac')}>
                                    <label>
                                        <input checked={selected} type="checkbox" onChange={this.onChangeNicSelect} value={nic.get('mac')} />
                                        <span className="mac">{nic.get('mac')}</span>
                                    </label>
                                    <div className="tag">{nic.get('nic_tag')}</div>
                                </div>
                            )
                        }, this)
                    }
                    </div>
                    </div>
                </div>

                <div className="control-group">
                    <label className="control-label">NIC Tags Provided</label>
                    <div className="controls">
                        <Chosen multiple="true" value={this.state.linkAggr.nic_tags_provided} onChange={this.onChangeNicTags}>
                        {
                            this.state.nictags.map(function(nictag) {
                                return <option>{nictag.get('name')}</option>
                            }, this)
                        }
                        </Chosen>
                    </div>
                </div>
            </form>
            <button
                className="btn btn-primary save"
                disabled={ this.isValid() ? '' : 'disabled'}
                onClick={this.handleSubmit}>Save</button>
            <button className="btn back" onClick={this.props.handleBack}>Back</button>
            </div>
        )
    }
});

var Component = React.createClass({
    propTypes: {
        server: React.PropTypes.string.required
    },
    getInitialState: function() {
        return {
            mode: 'list',
            linkAggregations: []
        };
    },
    componentWillMount: function() {
        this.refreshAggregations();
    },
    refreshAggregations: function() {
        var model = new LinkAggrModel();
        var self = this;
        model.fetch({data: {belongs_to_uuid: this.props.server}}).done(function(res) {
            self.setState({linkAggregations: res});
        });
    },
    newLinkAggr: function(e) {
        e.preventDefault();
        this.setState({
            mode: 'new',
            formValues: {}
        });
    },
    onLinkAggregationFormBack: function() {
        this.setState({mode: 'list'});
    },
    onLinkAggregationSaved: function() {
        this.setState({mode: 'list'});
        this.refreshAggregations();
    },
    handleDelete: function(aggr) {
        var model = new LinkAggrModel(aggr);
        var res = model.destroy().done(function() {
        this.refreshAggregations();
        }.bind(this));
    },
    handleEdit: function(aggr) {
        this.setState({
            mode: 'edit',
            formValues: aggr
        });
    },
    render: function() {
        var nodes;
        if (this.state.mode === 'new') {
            nodes = [
                <LinkAggregationForm
                    handleSaved={this.onLinkAggregationSaved}
                    handleBack={this.onLinkAggregationFormBack}
                    server={this.props.server} />
            ];
        } else if (this.state.mode === 'edit') {
            nodes = [
                <LinkAggregationForm
                    handleSaved={this.onLinkAggregationSaved}
                    handleBack={this.onLinkAggregationFormBack}
                    initialLinkAggr={this.state.formValues}
                    server={this.props.server} />
            ];
        } else if (this.state.mode === 'list') {
            nodes = [
                <button onClick={this.newLinkAggr} className="btn btn-info new-link-aggr"><i className="icon-plus"></i> Link Aggregation</button>,
                <LinkAggregationsList
                    onEdit={this.handleEdit}
                    onDelete={this.handleDelete}
                    linkAggregations={this.state.linkAggregations} />,
                <div className="buttons">
                <button className="btn" data-dismiss="modal">Close</button>
                </div>
            ];
        }
        return <div className="link-aggr-component">
            <h1>Link Aggregations</h1>
            {nodes}
        </div>;
    }
});

module.exports = Component;
