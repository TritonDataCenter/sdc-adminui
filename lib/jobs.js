var assert = require('assert');
var sprintf = require('util').format;
var querystring = require('querystring');

module.exports = {
    listJobs: function(req, res, next) {
        var perPage = req.query.perPage || 100;
        var page = req.query.page || 1;

        var limit = perPage;
        var offset = ((page-1) * perPage);
        var query = { limit: limit, offset: offset };
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
