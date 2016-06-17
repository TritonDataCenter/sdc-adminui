/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

var React = require('react');
var app = require('../../../adminui');
var api = require('../../../request');
var utils = require('../../../lib/utils');

var VolumesList = require('./list');
var VolumesForm = require('./volume-form');
var FilterForm = require('./../../filter-form');

var Volumes = require('../../../models/volumes');
var Volume = require('../../../models/volume');

var VolumesPage = React.createClass({
    statics: {
        sidebar: 'volumes',
        url: function () {
            return 'volumes' + (location.search || '');
        }
    },
    getInitialState: function () {
        return {
            filterTypes: ['name', 'owner_uuid', 'type', 'volume_state', 'tag'],
            form: false
        };
    },
    componentWillMount: function () {
        this.collection = new Volumes();
        this.query(this.props.params);
        app.vent.trigger('settitle', 'volumes');
    },
    showForm: function () {
        this.setState({form: true});
    },
    hideForm: function () {
        this.setState({form: false});
    },
    handleSave: function () {
        this.setState({form: false});
        this.query(this.props.params);
    },
    render: function () {
        var state = this.state;
        return (
            <div className="page" id="page-vms">
                <div className="page-header">
                    <h1>Volumes
                        {app.user.role('operators') ?
                            <div className="actions">
                                <button disabled={state.form} onClick={this.showForm} className="create-button btn btn-info">
                                    <i className="fa fa-plus"></i> Create Volume
                                </button>
                            </div> : null
                        }
                    </h1>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        {state.form &&
                        <VolumesForm handleCancel={this.hideForm} handleSave={this.handleSave} />}
                        <section className="filter-form">
                            <FilterForm initialParams={this.props.params} handleSearch={this.query}
                                        buttonTitle='Search Volumes' types={state.filterTypes}/>
                        </section>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <div className="list-region">
                            <VolumesList volumes={this.collection} showActions={true} />
                        </div>
                    </div>
                </div>
            </div>
        );
    },

    query: function (params) {
        this.collection.params = utils.getVmSearchParams(params);
        this.collection.fetch({
            reset: true
        });
    }
});

module.exports = VolumesPage;
