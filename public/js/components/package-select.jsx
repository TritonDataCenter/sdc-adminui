var Packages = require('../models/packages');
var React = require('react');
var Chosen = require('react-chosen');
module.exports = React.createClass({
    getInitialState: function() {
        return { packages: [] }
    },
    componentWillMount: function() {
        var p = new Packages();
        p.fetchActive().done(function(packages) {
            this.setState({packages: packages});
        }.bind(this));
    },
    renderPackages: function() {
        return this.state.packages.map(function(p) {
            return <option value={p.uuid}>{p.name} {p.version}</option>
        });
    },
    render: function() {
        return <Chosen data-placeholder="Select a Package" name="billing_id">
            <option></option>
            {this.renderPackages()}
        </Chosen>;
    }
});
