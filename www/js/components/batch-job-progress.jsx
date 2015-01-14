var React = require('react');
var Modal = require('./modal');
var api = require('../request');
var _ = require('underscore');

var BatchJobProgress = React.createClass({
    displayName: 'BatchJobProgress',
    propsTypes: {
        'vms': React.PropTypes.array.isRequired,
        'name': React.PropTypes.string.isRequired,
        'jobs': React.PropTypes.array.isRequired,
        'onClose': React.PropTypes.func.isRequired
    },

    getInitialState: function() {
        return {
            jobData: {}
        };
    },

    componentWillMount: function() {
        this._interval = setInterval(this.fetchJobs.bind(this), 6000);
        this.fetchJobs();
    },

    componentWillUnmount: function() {
        clearInterval(this._interval);
    },

    fetchJobs: function() {
        this.props.jobs.map(function(job) {
            api.get('/api/jobs/'+job.job_uuid).end(function(res) {
                if (res.ok) {
                    var jobData = this.state.jobData;
                    jobData[job.job_uuid] = res.body;
                    this.setState({jobData: jobData});
                }
            }.bind(this));
        }, this);
    },

    render: function() {
        return <Modal id="batch-progress" {...this.props} onRequestHide={this.props.onClose} title={this.props.action} ref="modal">
            <div className="modal-body">
                {
                    this.props.vms.map(function(vm) {
                        var job = _.findWhere(this.props.jobs, {vm_uuid: vm.uuid});
                        var jobData = this.state.jobData[job.job_uuid];

                        console.log('[BatchJobProgress job]', jobData);

                        return <div className="item row">
                            <div className="col-sm-8">
                                <div className="alias">{vm.alias}</div>
                                <div className="uuid">{vm.uuid}</div>
                            </div>

                            <div className="col-sm-4">
                                {jobData ? <div className={"execution " + jobData.execution}>{jobData.execution}</div> : null }
                            </div>
                        </div>;
                    }, this)
                }
            </div>
            <div className="modal-footer">
                <button type="button" onClick={this.props.onClose} className="btn btn-link">Close</button>
            </div>
        </Modal>;

    }
});

module.exports = BatchJobProgress;
