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
var JobsList = require('./jobs-list');

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
    componentDidMount: function() {
        var n = this.refs.datepicker.getDOMNode();
        this.dateTimePicker = $(n).datetimepicker({language: 'en'});
        this.dateTimePicker.on('dp.change', this.onChange);
    },
    onChange: function(e) {
        this.props.onChange({value: e.date.utc().toDate() });
    },
    render: function() {
        return (
            <div className="form-group">
                <div ref="datepicker" className="input-group date-picker" data-date-format="YYYY-MM-DD HH:mm:ss">
                    <input ref="input" className="form-control" defaultValue={this.props.value}  type="text"></input>
                    <span className="input-group-addon"><span className="fa fa-calendar"></span></span>
                </div>
            </div>
        );
    }
});

var JobExecutionCriteria = React.createClass({
    onChange: function(e, val) {
        if (this.props.onChange) {
            this.props.onChange({value: val.selected});
        }
    },
    render: function() {
        var node;
        node = (<Chosen className="form-control" value={this.props.value} onChange={this.onChange} ref="chosen" name="execution">
            <option value="">any</option>
            <option value="succeeded">succeeded</option>
            <option value="failed">failed</option>
            <option value="running">running</option>
            <option value="queued">queued</option>
            <option value="canceled">canceled</option>
        </Chosen>);

        return <div className="form-group criteria criteria-execution">{node}</div>;
    }
});

var JobDateCriteria = React.createClass({
    onChange: function(e) {
        if (this.props.onChange) {
            this.props.onChange({value: e.value});
        }
    },
    render: function() {
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
        return <div className="criteria criteria-date">{node}</div>;
    }
});


var JobCriterias = React.createClass({
    getInitialState: function() {
        var state = {};
        if (this.props.initialCriteria && this.props.initialCriteria.params) {
            state = this.props.initialCriteria.params();
        } else {
            state = {};
        }
        return state;
    },
    onExecutionChange: function(change) {
        this.setState({execution: change.value});
        if (this.props.onChange) {
            this.props.onChange({
                params: this.state
            });
        }
    },
    onDateSinceChange: function(change) {
        console.log('onDateSinceChange', change.value);
        this.setState({since: change.value});
        if (this.props.onChange) {
            this.props.onChange({
                params: this.state
            });
        }
    },
    onDateUtilChange: function(change) {
        console.log('onDateUntilChange', change.value);
        this.setState({until: change.value});
        if (this.props.onChange) {
            this.props.onChange({
                params: this.state
            });
        }
    },
    render: function() {
        return <ul className="list-unstyled row">
            <li className="col-md-4"><span className="criteria-name">Execution</span><JobExecutionCriteria name="execution" onChange={this.onExecutionChange} value={this.state.execution} /></li>
            <li className="col-md-4" style={ {paddingRight:0} }><span className="criteria-name">Since</span><JobDateCriteria name="since" onChange={this.onDateSinceChange} value={this.state.since} /></li>
            <li className="col-md-4" style={ {paddingLeft:0} }><span className="criteria-name">Until</span><JobDateCriteria name="until" onChange={this.onDateUtilChange} value={this.state.until} /></li>
        </ul>;
    }
});


var JobFiltersList = React.createClass({
    propTypes: {
        filters: React.PropTypes.array,
        filter: React.PropTypes.object,
        onFilter: React.PropTypes.func
    },
    getInitialState: function() {
        var self = this;
        var counters = {};
        this.props.filters.map(function(f) {
            counters[f.name] = '?';
            var j = new Jobs({perPage: 100});
            j.params = f.params();
            j.fetch().done(function(r) {
                var c = (r.length > 99) ? '99+' : r.length;
                var counters = _.clone(self.state.counters);
                counters[f.name] = c;
                self.setState({counters: counters});
            });
        });
        return { counters: counters };
    },
    onFilter: function(f) {
        var params = (typeof(f.params) === 'function') ? f.params() : f.params;
        if (this.props.onFilter) {
            this.props.onFilter({name: f.name, params: params});
        }
    },
    render: function() {
        var liNodes = _.map(this.props.filters, function(f) {
            var pieces = f.name.split('|');
            var name = pieces[0];
            var time = pieces[1];
            return <li key={f.name}>
                    <a
                        className={f.name === this.props.filter.name ? 'current' : ''}
                        onClick={this.onFilter.bind(this, f)}>
                        <span className="counter">{this.state.counters[f.name]}</span>
                        <span className="name"> {name} </span>
                            <span className="timerange"> { time } </span>
                    </a></li>;
        }, this);

        return <ul className="list-unstyled">{liNodes}</ul>;
    }
});

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

    initialize: function(options) {
        options = options || {};
    },

    onFilterChange: function(f) {
        this.jobCriteras.replaceState(f.params);
        this.jobFilters.setProps({filter: f});
        for (var k in f.params) {
            if (f.params[k] === "") {
                delete f.params[k];
            }
            if (k === 'until' || k === 'since') {
                if (typeof(f.params[k]) === 'object') {
                    f.params[k] = moment(f.params[k]).utc().toDate().getTime();
                }
            }
        }
        this.jobsList.query(f.params);
    },

    onShow: function() {
        var initialFilter = PRESET_FILTERS[0];


        this.jobFilters = React.renderComponent(
            JobFiltersList({
                filters: PRESET_FILTERS,
                filter: initialFilter,
                onFilter: this.onFilterChange.bind(this)
            }), this.$('.job-filters-list').get(0));


        this.jobCriteras = React.renderComponent(
            JobCriterias({
                onChange: this.onFilterChange.bind(this),
                initialCriteria: initialFilter
            }), this.$('.jobs-criteria-container').get(0));

        this.jobsList = new JobsList({params: initialFilter.params() });
        this.jobsListRegion.show(this.jobsList);
    },
});


module.exports = JobsView;
