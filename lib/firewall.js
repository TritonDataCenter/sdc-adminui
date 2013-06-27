var restify =  require('restify');
var assert = require('assert-plus');

var _ = require('underscore');

var sprintf = require('util').format;
var errors = require('./errors');


module.exports = {
    getRule: function(req, res, next) {
        req.sdc[req.dc].fwapi.getRule(req.params.uuid, function(err, rule) {
            if (err) {
                return next(err);
            }
            res.send(rule);
            return next();
        });
    },

    createRule: function(req, res, next) {
        req.sdc[req.dc].fwapi.createRule(req.body, function(err, rule) {
            if (err) {
                return next(err);
            }
            res.send(rule);
            return next();
        });
    },

    listRules: function(req, res, next) {
        function cb(err, rules) {
            if (err) {
                return next(err);
            }

            res.send(rules);
            return next();
        }

        if (req.query.vm_uuid) {
            var vm_uuid = req.query.vm_uuid;
            delete req.query.vm_uuid;

            req.sdc[req.dc].fwapi.getVMrules(vm_uuid, req.query, cb);
        } else {
            req.sdc[req.dc].fwapi.listRules(req.query, cb);
        }
    },

    updateRule: function(req, res, next) {
        req.sdc[req.dc].fwapi.updateRule(req.params.uuid, req.body, function(err, rule) {
            if (err) {
                return next(err);
            }

            res.send(rule);
            return next();
        });
    }
};
