var assert = require('assert');
var sprintf = require('util').format;
var querystring = require('querystring');

module.exports = {
    listJobs: function listJobs(req, res, next) {
        var query = req.query;
        var perPage = query.perPage || 100;
        var page = query.page || 1;

        delete query.perPage;
        delete query.page;

        if (page && perPage) {
            query.offset = ((page-1) * perPage);
            query.limit = perPage;
        }

        req.sdc[req.dc].workflow.get(
            sprintf('/jobs?%s', querystring.stringify(query)),
            function(err, creq, cres, jobs)
        {
            if (err) {
                return next(err);
            } else {
                res.send(jobs);
                return next();
            }
        });
    },
    getJob: function getJob(req, res, next) {
        var jobUuid = req.params.uuid;
        var url = sprintf('/jobs/%s', jobUuid);
        req.sdc[req.dc].workflow.get(url, function(err, creq, cres, obj) {
            if (err) {
                return next(err);
            }

            res.send(obj);
            return next();
        });
    },
    cancelJob: function cancelJob(req, res, next) {
        var jobUuid = req.params.uuid;
        var url = sprintf('/jobs/%s/cancel', jobUuid);
        req.sdc[req.dc].workflow.post(url, {}, function(err, creq, cres, obj) {
            if (err) {
                return next(err);
            }

            res.send(obj);
            return next();
        });
    },
    getJobInfo: function getJobInfo(req, res, next) {
        var jobUuid = req.params.uuid;
        var url = sprintf('/jobs/%s/info', jobUuid);
        req.sdc[req.dc].workflow.get(url, function(err, creq, cres, obj) {
            if (err) {
                return next(err);
            }

            res.send(obj);
            return next();
        });
    }
};
