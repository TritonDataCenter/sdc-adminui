/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

 var React = require('react');

 var RoutesList = React.createClass({
    render: function () {
        var routes = Object.keys(this.props.routes).map(function (key) {
            return {
                host: key,
                gateway: this.props.routes[key]
            };
        }.bind(this));
        return (
            <div>
                <h3>Routes</h3>
                <table className="table editable">
                    <thead>
                        <th>IP / Subnet</th>
                        <th>Gateway</th>
                    </thead>

                    <tbody className="unstyled">
                    { 
                        routes.map(function (route) {
                            return <tr>
                                <td className="host">{route.host}</td>
                                <td className="gateway">{route.gateway}</td>
                            </tr>
                        })
                    }
                    </tbody>
                </table>
            </div>
        );
    }
 });

 module.exports = RoutesList;
 