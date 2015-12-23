/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

/** @jsx React.DOM **/

var api = require('../../request');

var React = require('react');

var LinkAggregationForm = require('./form.jsx');
var LinkAggregationsList = require('./list.jsx');



var Component = React.createClass({
    propTypes: {
        server: React.PropTypes.string.isRequired,
        nics: React.PropTypes.array
    },
    getInitialState: function () {
        return {
            mode: 'list',
            linkAggregations: []
        };
    },
    componentWillMount: function () {
        this.refreshAggregations();
    },
    refreshAggregations: function () {
        api.get('/api/linkaggrs').query({belongs_to_uuid: this.props.server}).end(function (res) {
            this.setState({linkAggregations: res.body});
        }.bind(this));
    },
    newLinkAggr: function (e) {
        e.preventDefault();
        this.setState({
            mode: 'new',
            formValues: {}
        });
    },
    onLinkAggregationFormBack: function () {
        this.setState({mode: 'list'});
    },
    onLinkAggregationSaved: function () {
        this.setState({mode: 'list'});
        this.refreshAggregations();
    },
    handleDelete: function (aggr) {
        if (window.confirm('Confirm Deleting Aggregation')) {
            api.del('/api/linkaggrs/' + aggr.id).end(function () {
                this.refreshAggregations();
            }.bind(this));
        }
    },
    handleEdit: function (aggr) {
        this.setState({
            mode: 'edit',
            formValues: aggr
        });
    },
    render: function () {
        var nodes;
        if (this.state.mode === 'new') {
            nodes = [
                <LinkAggregationForm
                    onSaved={this.onLinkAggregationSaved}
                    handleBack={this.onLinkAggregationFormBack}
                    nics={this.props.nics}
                    server={this.props.server} />
            ];
        } else if (this.state.mode === 'edit') {
            nodes = [
                <LinkAggregationForm
                    onSaved={this.onLinkAggregationSaved}
                    handleBack={this.onLinkAggregationFormBack}
                    initialLinkAggr={this.state.formValues}
                    nics={this.props.nics}
                    server={this.props.server} />
            ];
        } else if (this.state.mode === 'list') {
            nodes = [
                <button onClick={this.newLinkAggr} className="btn btn-info new-link-aggr"><i className="fa fa-plus"></i> Link Aggregation</button>,
                <LinkAggregationsList
                    onEdit={this.handleEdit}
                    onDelete={this.handleDelete}
                    nics={this.props.nics}
                    linkAggregations={this.state.linkAggregations} />,
                <div className="buttons">
                <button className="btn btn-default" data-dismiss="modal">Close</button>
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
