/** @jsx React.DOM **/
var api = require('adminui-api');

var React = require('react');
var Chosen = require('react-chosen');
var _ = require('underscore');

var LinkAggregationForm = require('./form.jsx');
var LinkAggregationsList = require('./list.jsx');



var Component = React.createClass({
    propTypes: {
        server: React.PropTypes.string.required
    },
    getInitialState: function() {
        return {
            mode: 'list',
            linkAggregations: []
        };
    },
    componentWillMount: function() {
        this.refreshAggregations();
    },
    refreshAggregations: function() {
        api.get('/_/linkaggrs').query({belongs_to_uuid: this.props.server}).end(function(res) {
            this.setState({linkAggregations: res.body});
        }.bind(this));
    },
    newLinkAggr: function(e) {
        e.preventDefault();
        this.setState({
            mode: 'new',
            formValues: {}
        });
    },
    onLinkAggregationFormBack: function() {
        this.setState({mode: 'list'});
    },
    onLinkAggregationSaved: function() {
        this.setState({mode: 'list'});
        this.refreshAggregations();
    },
    handleDelete: function(aggr) {
        api.del('/_/linkaggrs/'+aggr.id).end(function() {
            this.refreshAggregations();
        }.bind(this));
    },
    handleEdit: function(aggr) {
        this.setState({
            mode: 'edit',
            formValues: aggr
        });
    },
    render: function() {
        var nodes;
        if (this.state.mode === 'new') {
            nodes = [
                <LinkAggregationForm
                    onSaved={this.onLinkAggregationSaved}
                    handleBack={this.onLinkAggregationFormBack}
                    server={this.props.server} />
            ];
        } else if (this.state.mode === 'edit') {
            nodes = [
                <LinkAggregationForm
                    onSaved={this.onLinkAggregationSaved}
                    handleBack={this.onLinkAggregationFormBack}
                    initialLinkAggr={this.state.formValues}
                    server={this.props.server} />
            ];
        } else if (this.state.mode === 'list') {
            nodes = [
                <button onClick={this.newLinkAggr} className="btn btn-info new-link-aggr"><i className="icon-plus"></i> Link Aggregation</button>,
                <LinkAggregationsList
                    onEdit={this.handleEdit}
                    onDelete={this.handleDelete}
                    linkAggregations={this.state.linkAggregations} />,
                <div className="buttons">
                <button className="btn" data-dismiss="modal">Close</button>
                </div>
            ];
        }
        return <div className="link-aggr-component">
            <h1>Link Aggregations</h1>
            {nodes}
        </div>;
    }
});

module.exports = Component;
