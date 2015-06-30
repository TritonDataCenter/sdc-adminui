/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";

/**
 * ./vms.js
 */


var React = require('react');
// var _ = require('underscore');
// var Backbone = require('backbone');

var app = require('../../../adminui');

var VmsListComponent = require('../../vms-list');
var FilterForm = require('./filter-form');


var Vms = require('../../../models/vms');


var VmsPage = React.createClass({
    statics: {
        sidebar: 'vms',
        url: function() {
            return 'vms';
        }
    },
    getInitialState: function() {
        return {
            initialFilter: JSON.parse(window.localStorage.getItem('vms::last_filter')) || {}
        };
    },
    componentWillMount: function() {
        this.collection = new Vms(null, { perPage: 20 });
        this.query(this.state.initialFilter);
        app.vent.trigger('settitle', 'vms');
    },
    render: function() {
        return (
            <div className="page" id="page-vms">
                <div className="page-header">
                  <h1>Containers
                    { app.user.role('operators') ?
                        <div className="actions">
                          <button onClick={this.provision} className="provision-button btn btn-info"><i className="fa fa-plus"></i> Provision Container</button>
                        </div> : null
                    }
                  </h1>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <section className="filter-form">
                            <FilterForm initialParams={this.state.initialFilter} handleSearch={this.query} />
                        </section>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <div className="list-region">
                            <VmsListComponent collection={this.collection} />
                        </div>
                    </div>
                </div>
            </div>
        );
    },

    provision: function() {
        app.vent.trigger('showview', 'provision', {});
    },
    query: function(params) {
        this.collection.params = params;
        this.collection.firstPage();
        this.collection.fetch({reset: true}).done(function() {
            var val = JSON.stringify(params);
            console.log('[vms] set vms::last_filter', val);
            window.localStorage.setItem('vms::last_filter', val);
        });
    },
    onMoreVms: function() {
        this.next();
    },
    next: function() {
        if (this.collection.hasNext()) {
            this.collection.next();
            this.collection.fetch({remove: false});
        }
    }
});


module.exports = VmsPage;
