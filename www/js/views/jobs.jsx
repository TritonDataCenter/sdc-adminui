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

var Backbone = require('backbone');
var _ = require('underscore');
var moment = require('moment');
var $ = require('jquery');
var React = require('react');
var Chosen = require('react-chosen');
var Jobs = require('../models/jobs');
var Servers = require('../models/servers');
var JobsList = require('./jobs-list');
var ServerTypeahead = require('../components/server-typeahead');

var adminui = require('../adminui');

var PRESET_FILTERS = [
    {
        name: 'Recent Jobs | last 24 hours',
        params: function() {
            return {
                since: moment().subtract('hours', 24).toDate().getTime()
            };
        }
    },
    {
        name: 'Recent Failed | last 24 hours',
        params: function() {
            return {
                since: moment().subtract('hours', 24).toDate().getTime(),
                execution: 'failed'
            };
        }
    },
    {
        name: 'All Jobs | last 72 hours',
        params: function() {
            return {
                since: moment().subtract('hours', 72).toDate().getTime()
            };
        }
    }
];

var DatePicker = React.createClass({
    componentDidMount: function () {
        this.dateTimePicker = $(this.refs.datepicker.getDOMNode()).datetimepicker({language: 'en'});
        this.dateTimePicker.on('dp.change', this.onChange);
        this.dateTimePicker.on('dp.show', this.onChange);
    },
    onChange: function (e) {
        this.props.onChange({value: e.date.utc().toDate()});
    },
    render: function () {
        return (<div className="form-group">
            <div ref="datepicker" className="input-group date-picker" data-date-format="YYYY-MM-DD HH:mm:ss">
                <input ref="input" className="form-control" defaultValue={this.props.value} type="text"></input>
                <span className="input-group-addon"><span className="fa fa-calendar"></span></span>
            </div>
        </div>);
    }
});

var JobExecutionCriteria = React.createClass({
    onChange: function (e, val) {
        if (this.props.onChange) {
            this.props.onChange({execution: val.selected});
        }
    },
    render: function () {
        return (
            <div className="form-group criteria criteria-execution">
                <Chosen className="form-control" value={this.props.value} onChange={this.onChange} ref="chosen" name="execution">
                    <option value="">any</option>
                    <option value="succeeded">succeeded</option>
                    <option value="failed">failed</option>
                    <option value="running">running</option>
                    <option value="queued">queued</option>
                    <option value="canceled">canceled</option>
                </Chosen>
            </div>
        );
    }
});

var JobDateCriteria = React.createClass({
    onChange: function (e) {
        if (this.props.onChange) {
            var result = {};
            result[this.props.name] = e.value;
            this.props.onChange(result);
        }
    },
    render: function () {
        var value;
        if (this.props.value) {
            if (typeof(this.props.value) === 'number') {
                value = moment(this.props.value);
            } else {
                value = moment(this.props.value);
            }
            value = value.utc().format("YYYY-MM-DD HH:mm:ss");
        } else {
            value = "";
        }
        var node = (<DatePicker onChange={this.onChange} value={value} />);
        return (<div className="criteria criteria-date">{node}</div>);
    }
});

var JobCriterias = React.createFactory(React.createClass({
    getInitialState: function () {
        var state = {};
        if (this.props.initialCriteria && this.props.initialCriteria.params) {
            state = this.props.initialCriteria.params();
        } else {
            state = {};
        }
        return state;
    },
    onChange: function (params) {
        var self = this;
        if (typeof params === 'object') {
            self.setState(params);
        }
    },
    onSelectServer: function (uuid) {
        this.onChange({server_uuid: uuid});
    },
    onSearch: function () {
        var self = this;
        var search = function () {
            if (self.props.onChange) {
                self.props.onChange({
                    params: self.state
                });
            }
        }
        this.setState({
            name: React.findDOMNode(this.refs.jobNameField).value
        }, search);
    },
    render: function () {
        return (
            <div>
                <ul className="list-unstyled row">
                    <li className="col-md-4">
                        <span className="criteria-name">Execution</span>
                        <JobExecutionCriteria name="execution" onChange={this.onChange} value={this.state.execution} />
                    </li>
                    <li className="col-md-4 since">
                        <span className="criteria-name">Since</span>
                        <JobDateCriteria name="since" onChange={this.onChange} value={this.state.since} />
                    </li>
                    <li className="col-md-4 until">
                        <span className="criteria-name">Until</span>
                        <JobDateCriteria name="until" onChange={this.onChange} value={this.state.until} />
                    </li>
                </ul>
                <ul className="list-unstyled row">
                    <li className="col-md-4">
                        <span className="criteria-name">Server</span>
                        <div className="form-group criteria">
                            <ServerTypeahead className="form-control" onChange={this.onSelectServer} />
                        </div>
                    </li>
                    <li className="col-md-4">
                        <span className="criteria-name">Job Name</span>
                        <div className="form-group">
                            <input className="form-control" ref="jobNameField" type="text"></input>
                        </div>
                    </li>
                    <li className="col-md-4">
                        <div className="form-group">
                            <button type="submit" onClick={this.onSearch} className="btn btn-sm btn-primary">
                                <i className="fa fa-search"></i> Search Jobs
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
        );
    }
}));


var JobFiltersList = React.createFactory(React.createClass({
    propTypes: {
        filters: React.PropTypes.array,
        filter: React.PropTypes.object,
        onFilter: React.PropTypes.func
    },
    getInitialState: function () {
        var self = this;
        var counters = {};
        this.props.filters.map(function (filter) {
            counters[filter.name] = '?';
            var jobs = new Jobs({perPage: 100});
            jobs.params = filter.params();
            jobs.fetch().done(function (result) {
                var counters = _.clone(self.state.counters);
                counters[filter.name] = result.length > 99 ? '99+' : result.length;
                self.setState({counters: counters});
            });
        });
        return {counters: counters};
    },
    onFilter: function (filter) {
        var params = typeof filter.params === 'function' ? filter.params() : filter.params;
        if (this.props.onFilter) {
            this.props.onFilter({name: filter.name, params: params});
        }
    },
    render: function () {
        var liNodes = _.map(this.props.filters, function (filter) {
            var pieces = filter.name.split('|');
            var name = pieces[0];
            var time = pieces[1];
            return (
                <li key={filter.name}>
                    <a className={filter.name === this.props.filter.name ? 'current' : ''}
                        onClick={this.onFilter.bind(this, filter)}>
                        <span className="counter">{this.state.counters[filter.name]}</span>
                        <span className="name"> {name} </span>
                        <span className="timerange"> {time} </span>
                    </a>
                </li>
            );
        }, this);

        return (<ul className="list-unstyled">{liNodes}</ul>);
    }
}));

var JobsView = Backbone.Marionette.Layout.extend({
    name: 'jobs',
    id: 'page-jobs',
    template: require('../tpl/jobs.hbs'),

    regions: {
        'jobsListRegion': '.jobs-list-region'
    },

    url: function() {
        return '/jobs';
    },

    initialize: function (options) {
        options = options || {};
    },

    onFilterChange: function (filter) {
        this.jobCriteras.replaceState(filter.params);
        this.jobFilters.setProps({filter: filter});
        for (var key in filter.params) {
            var value = filter.params[key];
            if (value === '') {
                delete filter.params[key];
            } else if ((key === 'until' || key === 'since') && typeof value === 'object') {
                filter.params[key] = moment(value).utc().toDate().getTime();
            }
        }
        this.jobsList.query(filter.params);
    },

    onShow: function () {
        var initialFilter = PRESET_FILTERS[0];

        adminui.vent.trigger('settitle', 'jobs');

        this.jobFilters = React.render(
            JobFiltersList({
                filters: PRESET_FILTERS,
                filter: initialFilter,
                onFilter: this.onFilterChange.bind(this)
            }), this.$('.job-filters-list').get(0));


        this.jobCriteras = React.render(
            JobCriterias({
                onChange: this.onFilterChange.bind(this),
                initialCriteria: initialFilter
            }), this.$('.jobs-criteria-container').get(0));

        this.jobsList = new JobsList({params: initialFilter.params()});
        this.jobsListRegion.show(this.jobsList);
    },
});


module.exports = JobsView;
