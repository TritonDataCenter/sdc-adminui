/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var moment = require('moment');
var React = require('react');
var Jobs = require('../models/jobs');
var BackboneMixin = require('./_backbone-mixin');
var adminui = require('../adminui');



var JobsList = React.createClass({
    displayName: 'JobsList',
    mixins: [BackboneMixin],
    propTypes: {
        perPage: React.PropTypes.number,
        page: React.PropTypes.number,
        params: React.PropTypes.object
    },
    getBackboneModels: function() {
        return [this.collection];
    },
    componentWillMount: function() {
        this.collection = new Jobs(null, {
            perPage: this.props.perPage,
            page: this.props.page
        });
        this.collection.params = this.props.params;
        this.collection.on('fetch:start', function() {
            this.setState({'fetching': true});
        }, this);
        this.collection.on('fetch:done', function() {
            this.setState({'fetching': false});
        }, this);
        this.collection.firstPage();
        this.collection.fetch();
    },
    _navigateToJobDetails: function(e) {
        e.preventDefault();
        var uuid = e.currentTarget.getAttribute('data-uuid');
        adminui.router.showJob(uuid);
    },
    renderJobItem: function(model) {
        var job = model.toJSON();
        job.duration = parseFloat(Math.round(model.duration() * 100) / 100).toFixed(2);

        if (job.created_at) {
            job.when = moment(job.created_at).utc().format('lll');
        } else {
            job.when = 'unknown';
        }

        if (job.params && job.params.subtask) {
            job.summary = job.params.subtask;
        }

        return <tr key={job.uuid}>
            <td className="execution">
                <span className={job.execution}>{job.execution}</span>
            </td>
            <td>
                <a onClick={this._navigateToJobDetails} data-uuid={job.uuid} href={'/jobs/'+job.uuid} className="name">{job.name} <small>{job.summary}</small></a>
                <div className="uuid"><span className="selectable">{job.uuid}</span></div>
            </td>
            <td>
                {job.when}<br />
                <span className="duration"><i className="fa fa-clock-o"></i> {job.duration}s</span>
            </td>
        </tr>;
    },
    render: function() {
        if (this.state.fetching) {
            return <div className="zero-state">
                Retrieving Jobs...
            </div>;
        }
        if (! this.collection.length) {
            return <div className="zero-state">
                There are no jobs found matching the specified criteria
            </div>;
        }

        return <div className="jobs-list">
            <table className="table jobs-table">
                <thead>
                    <th className="execution"></th>
                    <th className="name">Name / UUID</th>
                    <th className="when">When</th>
                </thead>
                <tbody>{this.collection.map(this.renderJobItem)}</tbody>
            </table>
        </div>;
    }
});

module.exports = JobsList;
