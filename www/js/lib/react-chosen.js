/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');
var Chosen = React.createClass({
    displayName: 'Chosen',
    componentDidUpdate: function() {
        // chosen doesn't refresh the options by itself, babysit it
        $(this.refs.select.getDOMNode()).trigger('chosen:updated');
    },
    propTypes: {
        onChange: React.PropTypes.func
    },
    componentDidMount: function(select) {
        $(this.refs.select.getDOMNode())
        .chosen({
            disable_search_threshold: this.props.disableSearchThreshold,
            no_results_text: this.props.noResultsText,
            max_selected_options: this.props.maxSelectedOptions,
            allow_single_deselect: this.props.allowSingleDeselect,
            width: this.props.width,
            search_contains: true
        })
        .on('chosen:maxselected', this.props.onMaxSelected)
        .on('chosen:showing_dropdown', this.props.onShowingDropdown)
        .on('chosen:hiding_dropdown', this.props.onHidingDropdown)
        .on('chosen:no_results', this.props.onNoResults)
        .on('chosen:ready', this.props.onReady)
        .change(this.props.onChange);
    },
    componentWillUnmount: function() {
        $(this.refs.select.getDOMNode()).off('chosen:ready chosen:maxselected chosen:showing_dropdown chosen:hiding_dropdown chosen:no_results change');
    },
    getDefaultProps: function() {
        return {
            width: '100%'
        }
    },
    activate: function() {
        $(this.refs.select.getDOMNode()).trigger('chosen:activate');
    },
    open: function() {
        $(this.refs.select.getDOMNode()).trigger('chosen:open')
    },
    close: function() {
        $(this.refs.select.getDOMNode()).data('chosen').close_field();
        $(this.refs.select.getDOMNode()).data('chosen').container.remove();
    },
    render: function() {
        return this.transferPropsTo(React.DOM.select({ref: 'select'}, this.props.children));
    }
});
