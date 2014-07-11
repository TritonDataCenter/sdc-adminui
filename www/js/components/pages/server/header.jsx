var React = require('react');
var BackboneMixin = require('../../_backbone-mixin');

var ServerPageHeader = React.createClass({
    mixins: [BackboneMixin],
    getBackboneModels: function() {
        return [this.props.server];
    },
    render: function() {
        var server = this.props.server;
        return <div className="page-header">
            <div className="resource-status">
                {
                    server.get('status') === 'setting_up' ?
                    <span className="server-setting-up">Setting Up</span>
                    :
                    <span className={'server-state ' + server.get('status') }>{server.get('status')}</span>
                }
            </div>
            <h1> { server.get('hostname') } <small className="uuid selectable">{server.get('uuid')}</small> </h1>
        </div>;
    }
});

module.exports = ServerPageHeader;
