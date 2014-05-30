/** @jsx React.DOM */
var React = require('react');
var _ = require('underscore');

var MantaAgentsDashboard = React.createClass({
    displayName: 'MantaAgentsDashboard',
    statics: {
        'url': function() {
            return '/manta/agents'
        },
        'sidebar':'manta-agents'
    },
    render: function() {
        return <div id="page-manta-agents-dashboard">
            <div className="page-header">
                <h1>Agemts</h1>

                <ul className="list-unstyled agents-list">
                    <li>
                        <div className="zones">
                        {
                            _.range(120).map(function(n) {
                                return <div key={n} className="zone"></div>
                            })
                        }
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    }
});


module.exports = MantaAgentsDashboard;
