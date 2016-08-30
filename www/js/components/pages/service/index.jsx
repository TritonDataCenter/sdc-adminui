/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

'use strict';

var React = require('react');
var adminui = require('../../../adminui');
var _ = require('underscore');
var ServiceModel = require('../../../models/service');

var ErrorAlert = require('../../error-alert');
var Metadata =  require('../vm/metadata');

var ServicePage = React.createClass({
    statics: {
        sidebar: 'services',
        url: function (props) {
            return _.str.sprintf('/services/%s', props.uuid);
        }
    },
    getInitialState: function () {
        return {
            loading: true
        };
    },
    componentDidMount: function () {
        var self = this;
        var service = new ServiceModel({uuid: this.props.uuid});
        service.fetch().done(function (model) {
            self.setState({loading: false, service: model});
        }).fail(function () {
            self.setState({loading: false, notFound: true});
        });
    },
    render: function () {
        var state = this.state;
        if (state.notFound) {
            return <div id="page-service">
                <div className="page-header">
                    <h2>Service Not Found</h2>
                </div>
                <p>The Service with ID <code>{this.props.uuid}</code> could not be found.</p>
            </div>;
        }

        if (state.loading) {
            return <div id="page-service">
                <div className="loading">
                    <i className="fa fa-circle-o-notch fa-spin" /> Fetching Service
                </div>
            </div>;
        }
        var service = state.service;
        var metadata = service.metadata || {};
        var params = service.params;
        var customerMetadata = params.customer_metadata || {};
        var tags = params.tags || {};

        return <div id="page-service">
            <div className="page-header">
                <h1>
                    <span className="service-name">{service.name}</span>&nbsp;
                    <small className="uuid selectable">{service.uuid}</small>&nbsp;
                    <span className="type">{service.type}</span>
                </h1>
            </div>
            {this.state.error && <ErrorAlert error={this.state.error} />}
            <section className="params">
                <div className="row">
                    <div className="col-md-12">
                        <h3>Tags</h3>
                        <div className="tags-container">
                            <Metadata
                                editing={state.editing === 'tags'}
                                metadata={tags} />
                        </div>
                    </div>
                </div>
            </section>
            <section className="metadata">
                <div className="row">
                    <div className="col-md-12">
                        <h3>Metadata
                            {adminui.user.role('operators') && state.editing !== 'metadata' &&
                                <div className="actions">
                                    <button onClick={this._handleEdit.bind(this, 'metadata')} className="btn-link btn-xs edit-internal-metadata">
                                        <i className="fa fa-pencil"></i> Edit Metadata
                                    </button>
                                </div>}
                        </h3>
                        <div className="metadata-region">
                            <Metadata
                                onSave={this._handleEditSave}
                                onCancel={this._handleEditCancel}
                                permanentKeys={['SERVICE_DOMAIN', 'SERVICE_NAME', 'assets-ip', 'user-script', 'sapi-url']}
                                editing={state.editing === 'metadata'}
                                metadata={metadata} />
                        </div>
                    </div>
                </div>
            </section>
        </div>;
    },

    _handleEditCancel: function () {
        this.setState({editing: false});
    },
    _handleEdit: function (type) {
        this.setState({editing: type});
    },
    _handleEditSave: function (data) {
        var self = this;
        var type = this.state.editing;
        var updatedData;
        if (type === 'metadata') {
            updatedData = {metadata: data, action: 'replace'};
        } else if (type === 'customer_metadata') {
            updatedData = {params: {customer_metadata: data}}
        } else if (type === 'tags') {
            updatedData = {params: {tags: data}}
        }
        if (!updatedData) {
            return self.setState({editing: false});
        }
        var service = new ServiceModel({uuid: this.props.uuid});
        service.update(updatedData, function (error, service) {
            if (error) {
                return self.setState({editing: false, error: error});
            }
            self.setState({editing: false, service: service});
        });
    }
});

module.exports = ServicePage;
