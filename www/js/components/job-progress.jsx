/** @jsx React.DOM */

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";

var moment = require('moment');
var React = require('react');
var _ = require('underscore');
var adminui = require('../adminui');
var $ = require('jquery');

var JobProgressHeader = React.createClass({
    render: function() {
        var job = this.props.job;

        return (
            <div className="job-progress-header">
                <h2 className="modal-title">Job {job.name}</h2>
                <small>{job.uuid}</small>
                <a onClick={this.props.onClickJobDetails} className="job-details pull-right">Job Details <i className="fa fa-fullscreen"></i></a>
            </div>
        );
    }
});

var JobProgressSummary = React.createClass({

    render: function() {
        var job = this.props.job;

        return (
            <div className="summary">
                <div className="chain-results">
                    <ol>
                    {_.map(job.chain_results, function(c, i) {
                        return (
                            <li key={c.name} className={ (c.error ? 'error' : '') }>
                            <div className="task">
                                <div className="name">{c.name}</div>
                                <div className="result">{c.result}</div>
                            </div>
                            <div className="time">
                                <div className="started-at"><i className="fa fa-play"></i> {c.started_at}</div>
                                <div className="finished-at"><i className="fa fa-stop"></i> {c.finished_at}</div>
                            </div>
                            <div className="duration">
                                <i className="fa fa-clock-o"></i><div className="value">{c.duration}</div>
                            </div>
                            {(function() {
                                if (c.error) {
                                    return (
                                        <div className="error">
                                        {(c.error && c.error.message) ? c.error.message : c.error }
                                        </div>
                                    );
                                }
                            })()}
                        </li>);
                    })}
                    </ol>
                </div>
            </div>
        );
    }
});

var JobProgressFooter = React.createClass({
    propTypes: {
        onClose: React.PropTypes.func,
        onCancel: React.PropTypes.func
    },
    handleCancel: function(e) {
        e.preventDefault();
        this.props.onCancel();
    },

    render: function() {
        var job = this.props.job;

        return (
            <div>
                <div className="pull-left">
                    <div className="execution"><div className={job.execution}> {job.execution}</div></div>
                    { (!job.finished && job.execution !== 'canceled') ? <span className="wait">Working... <img src="/img/job-progress-loading.gif" /></span> : '' }
                </div>
                {
                    (job.execution !== 'canceled' && !job.finished) ? (
                        <button onClick={this.handleCancel}
                            disabled={job.execution === 'canceling'}
                            className={'btn ' + (job.execution !== 'canceling' ? 'btn-danger' : '')}>
                            { (job.execution === 'canceling' ? 'Canceling...' : 'Cancel Job') }
                            </button>) : ''
                }

                <button onClick={this.props.onClose} className="btn btn-link">Close</button>
            </div>
        );
    }
});


var JobProgress = React.createClass({
    propTypes: {
        onCancel: React.PropTypes.func,
        onUpdate: React.PropTypes.func,
        onFinish: React.PropTypes.func
    },
    componentDidMount: function() {
        if (! this._timer) {
            this._timer = setInterval(this.update.bind(this), 2000);
        }
        this.update();
    },
    componentDidUnmount: function() {
        if (this._timer) {
            clearInterval(this._timer);
        }
    },
    onClickJobDetails: function() {
        adminui.vent.trigger('showview', 'job', {model: this.model});
    },
    update: function() {
        this.props.job.fetch({success: this.onUpdate});
    },
    render: function() {
        var job = this.props.job.toJSON();
        job.chain_results = _.map(job.chain_results, function(task) {
            var t = _.clone(task);
            t.started_at = moment(task.started_at).utc().format('YYYY-MM-DD HH:mm:ss');
            t.finished_at = moment(task.finished_at).utc().format('YYYY-MM-DD HH:mm:ss');
            t.duration = moment(task.finished_at).diff(moment(task.started_at), 'seconds', true) + 's';
            return t;
        });
        job.finished = job.execution === 'succeeded' || job.execution === 'failed';

        return (
            <div className="modal in" style={{display:'block'}} id="job-progress">
                <div className="modal-backdrop in" ref="backdrop"></div>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <JobProgressHeader job={job} onClickJobDetails={this._onClickJobDetails} />
                        </div>
                        <div className="modal-body">
                            <JobProgressSummary job={job} />
                        </div>
                        <div className="modal-footer">
                            <JobProgressFooter
                                onClose={this.props.onClose}
                                onCancel={this.props.onCancel}
                                job={job} />
                        </div>
                    </div>
                </div>
            </div>
        );
    },

    _onCancel: function() {
        this.model.cancel(function(err, job) {
            console.log('cancel response', err, job);
        });
    },

    onUpdate: function() {
        var job = this.props.job;
        var $node = $(this.getDOMNode());
        this.forceUpdate();

        $node.find('.modal-body').scrollTop($node[0].scrollHeight);

        var execution = job.get('execution');
        if (execution === 'canceled' || execution === 'succeeded' || execution === 'failed') {
            if (this.props.onFinish) {
                this.props.onFinish(execution);
            }
            clearInterval(this._timer);
        }
        if (this.props.onUpdate) {
            this.props.onUpdate('execution', execution);
        }
    }
});

module.exports = JobProgress;
