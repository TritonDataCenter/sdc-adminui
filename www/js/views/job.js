/** @jsx React.DOM **/

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";

var Backbone = require('backbone');
var _ = require('underscore');
var moment = require('moment');

var adminui = require('../adminui');
var React = require('react');
var BackboneMixin = React.createFactory(require('../components/_backbone-mixin'));
var JSONView = React.createFactory(require('../components/json-view'));
var Job = require('../models/job');

var JobDetailsComponent = React.createClass({
    mixins: [BackboneMixin],
    getBackboneModels: function() {
        return [this.state.job];
    },
    getInitialState: function() {
        return {job: this.props.job };
    },

    handleCancel: function(e) {
        e.preventDefault();
        var job = this.state.job;

        job.set({state: 'canceling'});
        this.setState({job: this.state.job});
        job.cancel(function(err, data) {
            console.log('cancel job response', err, data);
        });
    },

    render: function() {
        var job = this.state.job.toJSON();
        job.finished = this.state.job.finished();
        job.chain_results = _.map(job.chain_results, function(task) {
            var t = _.clone(task);
            t.started_at = moment(task.started_at).format('YYYY-MM-DD HH:mm:ss');
            t.finished_at = moment(task.finished_at).format('YYYY-MM-DD HH:mm:ss');
            t.duration = moment(task.finished_at).diff(moment(task.started_at), 'seconds', true) + 's';
            return t;
        });

        var chainResults = _.map(job.chain_results, function(task) {
            return (
                <li key={task.name} className={task.error ? 'error' : ''}>
                    <div className="task">
                        <div className="name">{task.name}</div>
                        <div className="result">{task.result}</div>
                        { (task.error) ? <div className="error">{task.error.message ? task.error.message : task.error }</div> : '' }
                    </div>

                    <div className="time">
                        <div className="started-at"><i className="fa fa-play"></i> {task.started_at}</div>
                        <div className="finished-at"><i className="fa fa-stop"></i> {task.finished_at}</div>
                    </div>

                    <div className="duration"><i className="fa fa-clock-o"></i><div className="value">{task.duration}</div></div>
                </li>
            )
        });


        return <div>
            <div className="page-header">
                <div className="resource-status">
                    <span className={'execution ' + job.execution}>{job.execution}</span>
                    <div className="pull-right">
                        {(! job.finished) ? <span className="wait">Working... <img src="/img/job-progress-loading.gif" /></span> : '' }
                    </div>
                </div>

                <h1>
                    Job {job.name} <small className="uuid selectable">{job.uuid}</small>
                    <div className="resource-actions">
                    {
                        (!job.execution !== 'canceled' && !job.finished) ?
                        <button onClick={this.handleCancel}
                                disabled={job.execution === 'canceling'}
                                className={'btn ' + (job.execution !== 'canceling' ? 'btn-danger' : '')}>
                            { (job.execution === 'canceling' ? 'Canceling...' : 'Cancel Job') }
                        </button> : ''
                    }
                    </div>
                </h1>
            </div>




            <section>
                {
                    (job.params.vm_uuid) ?
                      <div className="vm widget-content">
                      <strong>Virtual Machine</strong>
                      <span className="value"><a href={"/vms/" + job.params.vm_uuid}>{job.params.vm_uuid}</a></span>
                      </div> : ''
                }
                {
                    (job.params.server_uuid) ?
                      <div className="server widget-content">
                      <strong>Server</strong>
                      <span className="value"><a href={"/servers/"+ job.params.server_uuid}>{job.params.server_uuid}</a></span>
                      </div> : ''
                }
            </section>
            <section>
              <h2>Task Summary</h2>
              <div className="summary">
                <div className="chain-results">
                  <ol className="list-unstyled">{chainResults}</ol>
                </div>
              </div>
            </section>
            <section>
              <h2>Job Parameters</h2>
              <JSONView className="params" json={this.state.job.attributes.params} />
            </section>
            <section>
              <h2>Info Output</h2>
              <div className="info"></div>
            </section>
            <section>
              <h2>Raw Output</h2>
              <JSONView className="raw" json={this.state.job.attributes} />
            </section>
        </div>
    }
});


var JobView = Backbone.Marionette.ItemView.extend({
    sidebar: 'jobs',
    template: require('../tpl/job.hbs'),
    attributes: {
        'id': 'page-job'
    },

    url: function() {
        return _.str.sprintf('/jobs/%s', this.model.get('uuid'));
    },

    events: {
        'click .server a': 'navigateToServer',
        'click .vm a': 'navigateToVm'
    },

    modelEvents: {
        'sync': 'onSync',
        'error': 'onError'
    },

    initialize: function(options)  {
        if (options.uuid) {
            this.model = new Job({uuid: options.uuid});
        }
    },

    navigateToServer: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.vent.trigger('showview', 'server', {uuid: this.model.get('params').server_uuid});
    },

    navigateToVm: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.router.showVm(this.model.get('params').vm_uuid);
    },

    onError: function(e, xhr, s) {
        adminui.vent.trigger('notification', {
            level: 'error',
            message: 'Failed to fetch job: wfapi said: ' + xhr.responseData.message,
            persistent: true
        });
        this.close();
    },

    onSync: function() {
        if (this.model.finished()) {
            this.model.stopWatching();
        }
    },

    renderJobDetails: function() {
        React.render(JobDetailsComponent({ job: this.model }), this.$el.get(0));
    },

    onRender: function() {
        this.renderJobDetails();
        this.model.getJobInfo(this.renderInfo.bind(this));
        adminui.vent.trigger('settitle', _.str.sprintf('job: %s %s', this.model.get('name'), this.model.get('uuid') ));
    },

    renderInfo: function(info) {
        React.render( JSONView({ json: info }), this.$('.info').get(0));
    },

    onShow: function() {
        this.model.fetch();
        this.model.startWatching();
    },

    onClose: function() {
        this.model.stopWatching();
    }
});

module.exports = JobView;
