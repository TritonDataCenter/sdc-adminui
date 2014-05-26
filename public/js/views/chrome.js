/** @jsx React.DOM */

/**
 * Chrome
 *
 * This module manages the Layout & Pane for
 * the application
 */

var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');
var moment = require('moment');
var React = require('react');

var adminui = require('./adminui');

var Topnav = require('../components/topnav.jsx');
var SecondaryNav = require('../components/secondarynav.jsx');

var Notifier = require('./notifier');

var JobProgressView = require('./job-progress');

var Chrome = React.createClass({
    displayName: 'Chrome',
    getDefaultProps: function() {
        return {};
    },
    _handleSecondnaryMenuSelect: function(view) {
        adminui.vent.trigger('showview', view, {});
    },
    _handleRootMenuSelect: function(view) {
        adminui.vent.trigger('showview', view, {});
    },
    render: function() {
        if (! this.props.state.get('chrome.content')) {
            return <noscript/>;
        }

        var contentClass = 'chrome ' + (this.props.state.get('chrome.fullwidth') ? 'col-sm-12 fullwidth': 'col-sm-10');


        return (
            <div id="adminui">
                {
                    this.props.state.get('rootnav') && <Topnav
                        readonly={!adminui.user.role('operators')}
                        handleMenuSelect={this._handleRootMenuSelect}
                        currentDatacenter={this.props.state.get('datacenter')}
                        active={this.props.state.get('rootnav.active')}
                        user={adminui.user} />
                }
                { this.props.notifications && <div id="notifications"></div> }


                <div className="container-fluid">
                    <div className="row">
                        {
                            (!this.props.state.get('chrome.fullwidth')) &&
                                <div id="secondarynav-container" className="col-sm-2">
                                    <SecondaryNav
                                        handleMenuSelect={this._handleSecondnaryMenuSelect}
                                        active={this.props.state.get('secondarynav.active')} />
                                </div>
                        }
                        <div id="server-time"><i className="fa fa-clock-o"></i> UTC <time></time></div>
                        <div id="content" className={contentClass}>{ this.props.state.get('chrome.content') }</div>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = Chrome;

//     initialize: function(options) {
//         this.options = options || {};
//         this.user = options.user;
//         this.vent = options.vent;

//         this.notifier = new Notifier({ vent: this.vent });

//         this.listenTo(this.vent, 'error', this.onError, this);
//         this.listenTo(this.vent, 'showjob', this.onShowjob, this);
//         this.listenTo(this.vent, 'mainnav:highlight', this.highlight, this);

//         this.content.on('show', function(view) {
//             $(document.body).scrollTop(0);
//         });
//     },

//     renderTime: function() {
//         var serverTime = moment().utc().format("MMM D h:mm");
//         return this.$('#server-time time').html(serverTime);
//     },

//     onClose: function() {
//         clearInterval(this._timer);
//     },

//     goToUser: function(e) {
//         e.preventDefault();
//         this.vent.trigger('showview', 'user', {uuid: this.user.get('uuid') });
//     },

//     onSelect: function(view) {
//         this.renderTopNav({active: view});
//         this.vent.trigger("showview", view);
//     },

//     highlight: function(view) {
//         this.renderTopNav({active: view});
//     },

//     onError: function(err) {
//         err = err || {};
//         if (err.xhr && err.xhr.status >= 500) {
//             if (err.xhr.responseText.length) {
//                 var json = JSON.parse(err.xhr.responseText);
//                 err.responseBody = JSON.stringify(json, null, 2);
//             }
//             var tpl = require('../tpl/error.hbs');
//             $(tpl(err)).modal();
//         }
//     },

//     onShowjob: function(job) {
//         var jobView = new JobProgressView({model: job});
//         jobView.show();
//     },

//     onShow: function() {
//     },

//     onRender: function() {
//         if (! this._timer) {
//             this._timer = setInterval(this.renderTime.bind(this), 1000);
//         }
//         this.notifier.setElement(this.$("#notifications"));
//         this.renderTime();
//     }
// });

