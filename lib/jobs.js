var assert = require('assert');
var sprintf = require('util').format;

module.exports = {
    listJobs: function(req, res, next) {
        req.sdc[req.dc].workflow.get('/jobs', function(err, creq, cres, jobs) {
            if (err) {
                return next(err);
            } else {
                res.send(jobs);
                return next();
            }
        });
    },
    getJob: function(req, res, next) {
        var jobUuid = req.params.uuid;
        var url = sprintf('/jobs/%s', jobUuid);
        req.sdc[req.dc].workflow.get(url, function(err, creq, cres, obj) {
            if (err) {
                return next(err);
            }

            res.send(obj);
            return next();
        });
    }
};
