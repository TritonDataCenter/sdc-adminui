/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var assert = require('assert');
var sprintf = require('util').format;
var querystring = require('querystring');
var getRequestHeaders = require('./get-request-headers');

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

        req.sdc[req.dc].workflow.get({
            path: sprintf('/jobs?%s', querystring.stringify(query)),
            headers: getRequestHeaders(req)
        }, function (err, creq, cres, jobs) {
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
        req.sdc[req.dc].workflow.get({
            path: sprintf('/jobs/%s', jobUuid),
            headers: getRequestHeaders(req)
        }, function (err, creq, cres, obj) {
            if (err) {
                return next(err);
            }

            res.send(obj);
            return next();
        });
    },
    cancelJob: function cancelJob(req, res, next) {
        var jobUuid = req.params.uuid;
        req.sdc[req.dc].workflow.post({
            path: sprintf('/jobs/%s/cancel', jobUuid),
            headers: getRequestHeaders(req)
        }, {}, function (err, creq, cres, obj) {
            if (err) {
                return next(err);
            }

            res.send(obj);
            return next();
        });
    },
    getJobInfo: function getJobInfo(req, res, next) {
        var jobUuid = req.params.uuid;
        req.sdc[req.dc].workflow.get({
            path: sprintf('/jobs/%s/info', jobUuid),
            headers: getRequestHeaders(req)
        }, function (err, creq, cres, obj) {
            if (err) {
                return next(err);
            }

            res.send(obj);
            return next();
        });
    }
};
