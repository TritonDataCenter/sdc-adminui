var SDC_CLIENTS = require('sdc-clients');

var kang = require('kang');



function getMarlinAgentSources() {
    // list applications?name=manta

    // list instances?uuid=<manta_instance_id>
    // ask vmapi for the the servers
    // ask cnapi for the CN ips
    var sources = ['10.99.99.7:9080/kang/snapshot'];
    return sources.map(function(s) {
        return kang.knMakeSource(s);
    });
}



var _pendingResponses = [];
var _lastSnapshot;
var _lastSnapshotTime;

function getMarlinAgentsSnapshot(req, res, next) {
    req.log.info('getMarlinAgentsSnapshot');
    if (_lastSnapshot !== undefined && Date.now() - _lastSnapshotTime < 1000) {
        res.send(_lastSnapshot);
        return next();
    }

    _pendingResponses.push(res);

    var sources = getMarlinAgentSources();
    req.log.info(sources);

    kang.knFetchAll({
        sources: sources,
        clientOptions: { connectTimeout: 5000 }
    }, function(err, snapshot) {
        if (err) {
            req.log.error(err);
            _pendingResponses.forEach(function(response) {
                response.end(err);
            });
        } else {
            _pendingResponses.forEach(function(response) {
                response.send(snapshot);
            });
        }

        _lastSnapshot = snapshot;
        _pendingResponses = [];
        _lastSnapshotTime = Date.now();
    });
}


module.exports = {
    mount: function(app, pre) {
        app.get(
            { path: '/api/manta/agents', name: 'GetMarlinAgentsSnapshot'},
            pre, getMarlinAgentsSnapshot
        );
    }
};
