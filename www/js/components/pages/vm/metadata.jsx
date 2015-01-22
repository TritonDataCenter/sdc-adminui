/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

 var React = require('react');
 var $ = require('jquery');

 var MetadataList = React.createClass({
    propTypes: {
        onCancel: React.PropTypes.func.isRequired,
        onSave: React.PropTypes.func.isRequired,
        metadata: React.PropTypes.object.isRequired
    },
    getInitialState: function() {
        return {};
    },
    _onCancel: function(e) {
        this.props.onCancel();
    },
    _onSave: function() {
        var data = {};
        var $node = $(this.getDOMNode());
        $node.find('tbody tr').each(function(index, tr) {
            var $tr = $(tr);
            console.log($tr);
            var k = $tr.find('[name=key]').val();
            var v = $tr.find('[name=value]').val();
            if (k && v && k.length && v.length) {
                data[k] = v;
            }
        });
        console.log(data);
        this.props.onSave(data);
    },
    render: function() {
        var metadata = Object.keys(this.props.metadata).map(function(key) {
            return {
                key: key,
                value: this.props.metadata[key]
            };
        }.bind(this));

        var editing = this.props.editing || false;

        if (!metadata.length && !editing) {
            return <div className="zero-state">No data to display.</div>;
        }

         return (
            <div className="metadata-list">
            <table className="table editable">
                <thead>
                    <th>Name</th>
                    <th>Value</th>
                </thead>

                <tbody className="unstyled">
                {
                    metadata.map(function(m) {
                        return <tr key={m.key}>
                            <td className="key">
                            {
                                editing ?
                                <input type="text" name="key" className="form-control" defaultValue={m.key} />
                                :
                                <span className="value" type="text">{m.key}</span>
                            }
                            </td>

                            <td className="value">
                            {
                                editing ?
                                <textarea name="value" className="form-control value" defaultValue={m.value}></textarea>
                                :
                                <span className="value" type="text">{m.value}</span>
                            }
                            </td>
                        </tr>;
                    })
                }


                {
                    editing ?
                    <tr>
                      <td className="key">
                        <input type="text" className="form-control" name="key" defaultValue="" />
                      </td>
                      <td className="value">
                        <textarea name="value" className="form-control value"></textarea>
                      </td>
                    </tr> : null
                }
                </tbody>

                {
                    editing ?
                    <tfoot>
                        <tr>
                            <td colSpan="2">
                                <button onClick={this._onSave} className="btn btn-primary save pull-right">
                                    <i className="fa-plus-sign"></i> Save
                                </button>
                                <button onClick={this._onCancel} className="btn btn-link cancel pull-right">Cancel</button>
                            </td>
                        </tr>
                    </tfoot> : null
                }
            </table>
            </div>
         );
     }

 });

 module.exports = MetadataList;
