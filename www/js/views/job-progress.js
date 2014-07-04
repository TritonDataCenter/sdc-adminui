/** @jsx React.DOM */

"use strict";

var Backbone = require('backbone');
var moment = require('moment');
var React = require('react');
var _ = require('underscore');
var adminui = require('../adminui');

var JobProgressHeader = React.createClass({
    render: function() {
        var job = this.props.job;

        return (
            <div className="job-progress-header">
                <h2 className="modal-title">Job {job.name}</h2>
                <small>{job.uuid}</small>
                <a className="job-details pull-right">Job Details <i className="fa fa-fullscreen"></i></a>
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
                            <li key={c.name} className={c.error}>
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


    handleCancel: function(e) {
        e.preventDefault();
        this.props.onCancel();
    },

    render: function() {
        var job = this.props.job;

        return (
            <div>
            <div className="pull-left">
            <div className="execution"> <div className={job.execution}> {job.execution}</div> </div>
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

            <button className="btn btn-link" data-dismiss="modal">Close</button>
            </div>
        );
    }
});

var JobProgressComponent = React.createClass({
    render: function() {
        var job = this.props.job;
        return <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <JobProgressHeader job={job} />
                    </div>
                    <div className="modal-body">
                    <JobProgressSummary job={job} />
                    </div>
                    <div className="modal-footer">
                    <JobProgressFooter onCancel={this.props.onCancel} job={job} />
                    </div>
                </div>
            </div>;
    }
});





var JobProgressView = Backbone.Marionette.ItemView.extend({
    attributes: {
        'class': 'modal',
        'id': 'job-progress'
    },
    template: require('../tpl/job-progress.hbs'),

    events: {
        'click .job-details': 'navigateToJob'
    },

    initialize: function() {
    },

    navigateToJob: function() {
        adminui.vent.trigger('showview', 'job', {model: this.model});
        this.onClose();
    },

    serializeData: function() {
        var data = Backbone.Marionette.ItemView.prototype.serializeData.call(this, arguments);
        data.chain_results = _.map(data.chain_results, function(task) {
            var t = _.clone(task);
            t.started_at = moment(task.started_at).utc().format('YYYY-MM-DD HH:mm:ss');
            t.finished_at = moment(task.finished_at).utc().format('YYYY-MM-DD HH:mm:ss');
            t.duration = moment(task.finished_at).diff(moment(task.started_at), 'seconds', true) + 's';
            return t;
        });
        data.finished = data.execution === 'succeeded' || data.execution === 'failed';
        return data;
    },

    show: function() {
        this.render();
        this.update();

        if (! this._timer) {
            this._timer = setInterval(this.update.bind(this), 2000);
        }

        var modal = this.$el.modal();
        var timer = this._timer;
        modal.on('hidden', function() {
            clearInterval(timer);
        });
    },

    update: function() {
        this.model.fetch({success: this.onUpdate.bind(this)});
    },

    onCancel: function() {
        this.model.cancel(function(err, job) {
            console.log('cancel response', err, job);
        });
    },

    onRender: function() {
        var job = this.serializeData();

        this.component = React.renderComponent(
            <JobProgressComponent job={job} onCancel={this.onCancel.bind(this)} />, this.$el.get(0));
    },

    onClose: function() {
        this.$el.modal('hide');
        clearInterval(this._timer);
    },

    onUpdate: function() {
        var job = this.serializeData();
        this.component.setProps({job: job});

        this.$('.modal-body').scrollTop(this.$('.modal-body').get(0).scrollHeight);

        var execution = this.model.get('execution');

        if (execution === 'canceled' || execution === 'succeeded' || execution === 'failed') {
            this.trigger(execution);
            this.trigger('finished', execution);
            clearInterval(this._timer);
        }

        this.trigger('execution', this.model.get('execution'));
    }
});

module.exports = JobProgressView;
