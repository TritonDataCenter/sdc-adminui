var Chosen = React.createClass({
  displayName: 'Chosen',
  componentDidUpdate: function() {
    // chosen doesn't refresh the options by itself, babysit it
    $(this.getDOMNode()).trigger('chosen:updated');
  },
  componentDidMount: function(select) {
    $(select)
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
    $(this.getDOMNode()).off('chosen:ready chosen:maxselected chosen:showing_dropdown chosen:hiding_dropdown chosen:no_results change');
  },
  getDefaultProps: function() {
    return {
        width: '100%'
    }
  },
  activate: function() {
    $(this.getDOMNode()).trigger('chosen:activate');
  },
  open: function() {
    $(this.getDOMNode()).trigger('chosen:open')
  },
  close: function() {
    $(this.getDOMNode()).data('chosen').close_field();
    $(this.getDOMNode()).data('chosen').container.remove();
  },
  render: function() {
    return this.transferPropsTo(React.DOM.select(null, this.props.children));
  }
});
