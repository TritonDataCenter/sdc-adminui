var assert = require('assert-plus');
var _ = require('underscore');

/*
 * metrics stored in redis as a sorted set:
 *
 * metric:<metric_name>
 * key: <ts>
 * val: <val>
 */

var METRICS = {
    'memory_provisionable_bytes': function(options, cb) {
        var log = this.log;
        this.clients.cnapi.get("/servers?extras=memory", function(err, servers) {
            if (err) {
                log.fatal('error collecting metrics memory_provisionable_bytes', err);
                return;
            }
            var m = servers.map(function(s) {
                if (s.setup && s.memory_provisionable_bytes > 0) {
                    return s.memory_provisionable_bytes;
                } else {
                    return 0;
                }
            });

            var sum = m.reduce(function(l, c) {
                return c + l;
            }, 0);
            var d = Math.floor(new Date().getTime() / 1000);
            cb('memory_provisionable_bytes', d, sum);
        });
    }
};

var Collector = module.exports = function(options) {
    assert.object(options.clients);
    assert.object(options.redis);

    this.clients = options.clients;
    this.redis = options.redis;
    this.log = options.log;

    this._interval = null;
};

Collector.metrics = METRICS;

Collector.prototype.collect = function() {
    var log = this.log;
    var redis = this.redis;
    var self = this;
    this.log.info('Running collector.collect');
    var metrics = _.values(METRICS);
    metrics.forEach(function(fn) {
        fn.call(self, {}, function(name, ts, val) {
            log.info(name, ts, val);
            var data = {t: ts, v: val};
            var kval = JSON.stringify(data);
            redis.zadd('metric:' + name, ts, kval, function(err, n) {
                if (err) {
                    log.error(err);
                } else {
                    log.info('logged metric', name, kval, val);
                }
            });
        });
    });
};

Collector.prototype.start = function() {
    this.log.info('Starting Collector');
    if (!this._interval) {
        this._interval = setTimeout(this.collect.bind(this), 60*1000);
    }
    this.collect();
};

Collector.prototype.stop = function() {
    this.log.info('Stopping Collector');
    clearInterval(this._interval);
};

Collector.prototype.getMetrics = function(metric, options, cb) {
    assert.string(metric);
    var log = this.log;

    if (Object.keys(Collector.metrics).indexOf(metric) === -1) {
        return cb('Metric not found');
    }

    var start = options.start || '-inf';
    var end = options.end || '+inf';

    this.redis.zrangebyscore('metric:' + metric, start, end, function(err, data) {
        if (err) {
            return cb(new Error(err));
        }
        var points = [];
        data.map(function(val) {
            var i = null;
            try {
                i = JSON.parse(val);
                if (i.t && i.v) {
                    points.push(i);
                }
            } catch (e) {
                log.warn('data point parse error', val);
            }
        });
        cb(null, points);
    });
};
