

/**
 * ./dashboard.js
 *
 * Dashboard View
 **/

var Backbone = require('backbone');
var Rickshaw  = require('rickshaw');
var _ = require('underscore');
var moment = require('moment');

var adminui = require('../adminui');


var AlarmsView = require('./alarms');
var DashboardTemplate = require('../tpl/dashboard.hbs');
var Dashboard = Backbone.Marionette.ItemView.extend({
    id: 'page-dashboard',
    name: 'dashboard',
    url: 'dashboard',
    template: DashboardTemplate,

    initialize: function() {
        this.alarmsView = new AlarmsView({
            userUuid: adminui.user.getAdminUuid()
        });
    },

    _bytesToGb: function(val) {
        return val / 1024 / 1024 / 1024;
    },

    onRender: function() {
        this.alarmsView.setElement(this.$('#dashboard-alarms'));
        this.alarmsView.fetch();

        var self = this;
        $.getJSON("/_/stats/vm_count", function(res) {
            self.$('.vm-count').html(res.total);
        });

        $.getJSON("/_/stats/server_memory", function(res) {
            var total = self._bytesToGb(res.total);
            self.$('.server-total-memory').html(_.str.sprintf('%.2f GB', total));

            var provisionable = self._bytesToGb(res.provisionable);
            self.$('.server-provisionable-memory').html(_.str.sprintf('%.2f', provisionable));

            var percent = ((res.total - res.provisionable) / res.total) * 100;
            self.$('.server-utilization-percent').html(
                _.str.sprintf('%.2f%%', percent)
            );
        });

        $.getJSON("/_/stats/server_count", function(res) {
            self.$('.server-count').html(res.total);
            self.$('.server-reserved').html(res.reserved);
            self.$('.server-unreserved').html(res.unreserved);
        });

        $.getJSON("/_/users?per_page=1", function(res, status, xhr) {
            self.$('.user-count').html(xhr.getResponseHeader('x-object-count'));
        });


        new Rickshaw.Graph.Ajax({
            dataURL: '/_/metrics/memory_provisionable_bytes',
            element: this.$('.server-provisionable-memory-graph').get(0),
            width: 420,
            height: 200,
            min: 0,
            interpolation: 'step-after',
            padding: {
                top: 0.5,
                left: 0.2,
                bottom: 0.5
            },
            renderer: 'line',
            onData: function(d) {
                var data = [{
                    name: 'RAM',
                    color: 'lime',
                    data: d.map(function(v) {
                        return { x: v.t, y: v.v };
                    })
                }];
                console.log('data for provisionable memory ', data);
                return data;
            },
            onComplete: function(transport) {
                var graph = transport.graph;
                graph.render();

                var xAxis = new Rickshaw.Graph.Axis.Time({
                    graph: graph
                });
                xAxis.render();

                var yAxis = new Rickshaw.Graph.Axis.Y({
                    graph: graph,
                    ticks: 4,
                    orientation: 'left',
                    element: self.$('.y_axis').get(0),
                    max: 10000000,
                    tickFormat: function(y) {
                        var abs_y = Math.abs(y);
                        if (abs_y >= 1125899906842624)  { return Math.ceil(y / 1125899906842624) + "P"; }
                        else if (abs_y >= 1099511627776){ return Math.ceil(y / 1099511627776) + "T"; }
                        else if (abs_y >= 1073741824)   { return Math.ceil(y / 1073741824) + "G"; }
                        else if (abs_y >= 1048576)      { return Math.ceil(y / 1048576) + "M"; }
                        else if (abs_y >= 1024)         { return Math.ceil(y / 1024) + "K"; }
                        else if (abs_y < 1 && y > 0)    { return y.toFixed(2); }
                        else if (abs_y === 0)           { return ''; }
                        else                        { return y; }
                    }
                });

                yAxis.render();

                var hoverDetail = new Rickshaw.Graph.HoverDetail( {
                    graph: graph,
                    yFormatter: function(b) {
                        var gb = b/1024/1024/1024;
                        return _.str.sprintf('%0.1f GB', gb);
                    }
                });
            }
        });



        return this;
    }
});

module.exports = Dashboard;
