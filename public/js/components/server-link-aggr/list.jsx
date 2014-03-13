var LinkAggregationsList = module.exports = React.createClass({
    propTypes: {
        linkAggregations: React.PropTypes.array.required,
        onEdit: React.PropTypes.func,
        onDelete: React.PropTypes.func
    },
    render: function() {
        return (<div className="link-aggr-list">
        {
            this.props.linkAggregations.length === 0 ? (
                <div className="empty">There are no Aggregated Links on this node</div>
            )
            : (
                this.props.linkAggregations.map(function(link) {
                    return <div key={link.id} className="link-aggr">
                        <div className="link-aggr-name">{link.name}</div>
                        <div className="link-aggr-interfaces">
                        {
                            link.macs.map(function(mac) {
                                return <div key={mac} className="link-aggr-interface">
                                    {mac}
                                </div>
                            }, this)
                        }
                        </div>
                        <div className="actions">
                            <button onClick={this.props.onEdit.bind(null, link)} className="btn btn-edit"><i className="icon-pencil"></i> Edit</button>
                            <button onClick={this.props.onDelete.bind(null, link)} className="btn btn-delete"><i className="icon-trash"></i> Delete</button>
                        </div>
                    </div>
                }, this)
            )
        }
        </div>);
    }
});
