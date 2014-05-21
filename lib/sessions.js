var assert = require('assert'),
    crypto = require('crypto'),
    util = require('util');


var TOKEN_TIMEOUT = 90*1000;
var SESSIONS_BUCKET = 'sdc_adminui_sessions';
var SESSIONS_BUCKET_CFG = {
    index: {
        user_uuid: { type: "string" },
        expires: { type: "number" }
    },
    pre: []
};



/**
 * Constructor
 *
 * @param options {Object} Options must contain ``moray``, a moray client instance
 */
var Sessions = function(options) {
    options = options || {};
    assert.ok(options.moray, 'options.moray required | moray client instance');

    this.client = options.moray;
    this.log = options.log;
    this.checkAndCreateBucket();

    // every hour sweep expired sessions
    this._sweepExpiredSessionsInterval = setInterval(this.sweepExpiredSessions.bind(this), 2*60*1000);
};

module.exports = {
    Sessions: Sessions,
    createSessions: function(options) {
        return new Sessions(options);
    }
};

Sessions.prototype.ready = function() {
    this.sweepExpiredSessions();
};


Sessions.prototype.checkAndCreateBucket = function() {
    this.log.debug('initializing sessions bucket');
    this.client.getBucket(SESSIONS_BUCKET, function(err) {
        if (err) {
            if (err.name === 'BucketNotFoundError') {
                this._createBucket();
            } else {
                this.log.fatal(err, 'error retrieving sessions bucket');
            }
        } else {
            this.ready();
            this.log.info("sessions bucket ready.");
        }
    }.bind(this));
};


Sessions.prototype.sweepExpiredSessions = function() {
    var log = this.log;
    var now = (new Date()).getTime();
    var filter = '(expires<='+now+')';
    this.client.deleteMany(SESSIONS_BUCKET, filter, function(err) {
        if (err) {
            log.error(err, 'failed to delete expired sessions');
        } else {
            log.info('deleted expired sessions');
        }
    });
};

/**
 * Retrieve data associated with an auth token
 *
 * @param id {String} auth token identifier
 * @param cb {Function} callback in the form of fn(err, data) -> void
 */
Sessions.prototype.get = function(id, cb) {
    var self = this;

    this.log.debug('session.get %s', id);

    this.client.getObject(SESSIONS_BUCKET, id, function(err, obj) {
        self.log.debug('session.get cb', err, obj);
        if (err) {
            if (err.name === 'ObjectNotFoundError') {
                self.log.debug('session doesn\'t exist %s', id);
                return cb(null, null);
            } else {
                self.log.error(err);
                return cb(err);
            }
        }

        if (obj.value.expires < (new Date().getTime())) {
            self.log.debug('session expired %s', id);
            self.destroy(id);
            return cb(null, null);
        }

        var data = obj.value;
        if (null === data) {
            cb(null, null);
        } else {
            cb(null, data);
        }
    });
};

/**
 * Extends a Session's expiry by TOKEN_TIMEOUT given a session id
 *
 * @param id {String} session id
 * @param data {Object} data to set
 * @param cb {Function} callback in form of fn(err);
 */
Sessions.prototype.touch = function(id, cb) {
    var self = this;
    var client = self.client;
    if (! cb) {
        cb = function() {};
    }
    this.log.debug('touch %s', id);

    client.getObject(SESSIONS_BUCKET, id, function(err, obj) {
        if (err) {
            self.log.error(err);
            if (typeof(cb) === 'function') {
                return cb(err);
            }
        }

        var newTimeout = new Date().getTime() + TOKEN_TIMEOUT;
        var data = obj.value;
        data.expires = newTimeout;

        client.putObject(SESSIONS_BUCKET, id, data, function(err) {
            if (err) {
                cb(err);
            } else {
                cb(null);
            }
        });
    });
};

/**
 * Extends a Session's expiry by TOKEN_TIMEOUT given a session id
 *
 * @param id {String} session id
 * @param data {Object} data to set
 * @param cb {Function} callback in form of fn(err);
 */
Sessions.prototype.setData = function(id, data, cb) {
    var self = this;
    this.log.debug('touch %s', id);

    if (false === this.client.connected) {
        return cb(new Error('No Connection to client'));
    }

    var newTimeout = (new Date().getTime()) + TOKEN_TIMEOUT;
    data.expires = newTimeout;

    this.client.putObject(SESSIONS_BUCKET, id, data, function(err, v) {
        if (err) {
            self.log.error(err);
            if (typeof(cb) === 'function') {
                cb(err);
            }
        } else {
            if (typeof(cb) === 'function') {
                cb(null);
            }
        }
    });
};


/**
 * Destroys a Session
 *
 * @param id {String} session id
 * @param cb {Function} callback in form of fn(err);
 */
Sessions.prototype.destroy = function(id, cb) {
    var self = this;
    this.log.debug('touch %s', id);

    this.client.delObject(SESSIONS_BUCKET, id, function(err) {
        if (err) {
            self.log.error(err);
            if (typeof(cb) === 'function') {
                cb(err);
            }
        } else {
            if (typeof(cb) === 'function') {
                cb(null);
            }
        }
    });
};

/**
 * Creates a new Session given data to store with that token
 *
 * @param data Object, data to store with the token
 * @param callback Function callback in form of fn(err, token, data)
 */
Sessions.prototype.create = function(data, callback) {
    var log = this.log;

    var id = _makeToken();
    log.debug('create %s', id);

    var newTimeout = new Date().getTime() + TOKEN_TIMEOUT;
    data.expires = newTimeout;

    this.client.putObject(SESSIONS_BUCKET, id, data, function(err) {
        if (err) {
            callback(err);
        } else {
            callback(null, id, data);
        }
    });
};


function _makeToken() {
    var seed = crypto.randomBytes(20);
    var token = crypto.createHash('sha1').update(seed).digest('hex');
    return token;
}


Sessions.prototype._createBucket = function() {
    this.client.createBucket(SESSIONS_BUCKET, SESSIONS_BUCKET_CFG, function(err) {
        if (err) {
            this.log.fatal(err, 'sessions bucket create error' );
        } else {
            this.log.info("sessions bucket created.");
            this.ready();
        }
    }.bind(this));
};
