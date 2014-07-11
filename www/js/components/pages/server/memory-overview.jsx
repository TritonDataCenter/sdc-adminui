var React = require('react');
var ServerMemoryUtilizationCircle = require('./utilization-circle');
var BackboneMixin = require('../../_backbone-mixin');

var ServerMemoryOverview = React.createClass({
    mixins: [BackboneMixin],
    getBackboneModels: function() {
        return [this.props.server];
    },
    render: function() {
        var server = this.props.server.toJSON();

        server.memory_total_provisionable_bytes = (server.memory_total_bytes * (1-server.reservation_ratio));

        server.memory_provisionable_gb = (server.memory_provisionable_bytes/1024/1024/1024).toFixed(1);
        server.memory_reserved_gb = (server.reservation_ratio * server.memory_total_bytes/1024/1024/1024).toFixed(1);
        server.memory_unreserved_gb = ((1-server.reservation_ratio) * server.memory_total_bytes/1024/1024/1024).toFixed(1);
        server.memory_total_gb = (server.memory_total_bytes/1024/1024/1024).toFixed(1);
        server.memory_provisioned_gb = ((server.memory_total_provisionable_bytes - server.memory_provisionable_bytes)/1024/1024/1024).toFixed(1);
        if (server.memory_provisioned_gb <= 0) {
            server.memory_provisioned_gb = 0;
        }
        return <div className="memory-overview">
            <div className="row">
                <div className="server-memory-utilization-container">
                    <ServerMemoryUtilizationCircle diameter="120px" inner="38" server={this.props.server} />
                </div>
                <div className="provisionable-memory">
                    <div className="value">{server.memory_provisionable_gb} GB</div>
                    <div className="title">Provisionable RAM</div>
                </div>
                <div className="provisioned-memory">
                    <div className="value">{server.memory_provisioned_gb} GB</div>
                    <div className="title">Provisioned RAM</div>
                </div>
                <div className="reserved-memory">
                    <div className="value">{server.memory_reserved_gb} GB</div>
                    <div className="title">Reserved RAM</div>
                </div>
                <div className="unreserved-memory">
                    <div className="value">{server.memory_unreserved_gb} GB</div>
                    <div className="title">Unreserved RAM</div>
                </div>
                <div className="total-memory">
                    <div className="value">{server.memory_total_gb} GB</div>
                    <div className="title">Total RAM</div>
                </div>
            </div>
        </div>;
    }
});

module.exports = ServerMemoryOverview;
