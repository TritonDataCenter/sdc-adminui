
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
        if (req.body.global) {
            delete req.body.owner_uuid;
        }

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

        var query = req.query;
        if (query.vm_uuid) {
            var vm_uuid = query.vm_uuid;
            delete query.vm_uuid;

            req.sdc[req.dc].fwapi.getVMrules(vm_uuid, query, cb);
        } else {
            req.sdc[req.dc].fwapi.listRules(query, cb);
        }
    },

    updateRule: function(req, res, next) {
        if (req.body.global) {
            delete req.body.owner_uuid;
        }
        req.log.info(req.body, 'updateRule');

        delete req.body.version;
        req.sdc[req.dc].fwapi.updateRule(req.params.uuid, req.body, function(err, rule) {
            if (err) {
                req.log.fatal(err);
                return next(err);
            }

            res.send(rule);
            return next();
        });
    },
    deleteRule: function(req, res, next) {
        req.sdc[req.dc].fwapi.deleteRule(req.params.uuid, function(err, rule) {
            if (err) {
                req.log.fatal(err);
                return next(err);
            }

            res.send(rule);
            return next();
        });
    }
};
