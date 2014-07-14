var Modal =require('./modal');
var React = require('react');
var JSONExport = React.createClass({
    render: function() {
        return this.transferPropsTo(<Modal title="JSON Export" className="json-export">
            <div className="modal-body">
                <p>{this.props.description}</p>
                <textarea className="form-control" readOnly value={JSON.stringify(this.props.data, null, 2)}></textarea>
            </div>
        </Modal>);
    }
});

module.exports = JSONExport;
