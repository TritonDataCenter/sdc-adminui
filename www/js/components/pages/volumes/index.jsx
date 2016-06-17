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
var FilterForm = require('./../../filter-form');

var Volumes = require('../../../models/volumes');
var Volume = require('../../../models/volume');

var VolumesPage = React.createClass({
    statics: {
        sidebar: 'volumes',
        url: function () {
            var url = 'volumes';
            return location.pathname === '/volumes' ? (url + location.search || '') : url;
        }
    },
    getInitialState: function () {
        return {
            filterTypes: ['uuid', 'name', 'owner_uuid'],
            typeWidth: {uuid: 3},
            form: true
        };
    },
    componentWillMount: function () {
        this.collection = new Volumes();
        this.query(this.props.params);
        app.vent.trigger('settitle', 'volumes');
    },
    showForm: function () {
        app.vent.trigger('showcomponent', 'volume-form');
    },
    render: function () {
        var state = this.state;
        return (
            <div className="page" id="page-vms">
                <div className="page-header">
                    <h1>Volumes
                        {app.user.role('operators') ?
                            <div className="actions">
                                <button onClick={this.showForm} className="create-button btn btn-info">
                                    <i className="fa fa-plus"></i> Provision Volume
                                </button>
                            </div> : null
                        }
                    </h1>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <section className="filter-form">
                            <FilterForm initialParams={this.props.params} handleSearch={this.query}
                                        buttonTitle='Search Volumes' types={state.filterTypes} typeWidth={state.typeWidth}/>
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
