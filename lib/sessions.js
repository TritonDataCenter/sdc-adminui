var assert = require('assert'),
  crypto = require('crypto'),
  util = require('util');

var TOKEN_TIMEOUT = 5*60;



/**
 * Constructor
 *
 * @param options {Object} Options must contain ``redis``, a redis client instance
 */
var Sessions = function(options) {
  options = options || {};
  assert.ok(options.redis, 'options.redis required | redis client instance');

  this.redis = options.redis;
  this.log = options.log;
};

module.exports = Sessions;



/**
 * Retrieve data associated with an auth token
 *
 * @param id {String} auth token identifier
 * @param cb {Function} callback in the form of fn(err, data) -> void
 */
Sessions.prototype.get = function(id, cb) {
  var self = this;
  this.log.info('session.get %s', id);

  var k = _sessionKey(id);
  this.redis.get(k, function(err, data) {
    self.log.info('session.get cb', err, data);
    if (err) {
      self.log.error(err);
      cb(err);
    } else {
      if (null === data) {
        cb(null, null);
      } else {
        cb(null, JSON.parse(data));
      }
    }
  });
}

/**
 * Extends a Session's expiry by TOKEN_TIMEOUT given a session id
 *
 * @param id {String} session id
 * @param cb {Function} callback in form of fn(err);
 */
Sessions.prototype.touch = function(id, cb) {
  var self = this;
  this.log.info('session.touch %s', id);

  var k = _sessionKey(id);
  this.redis.expire(k, TOKEN_TIMEOUT, function(err, v) {
    if (err) {
      self.log.error(err);
      (typeof(cb) === 'function') && cb(err);
    } else {
      (typeof(cb) === 'function') && cb(null);
    }
  });
}

/**
 * Creates a new Session given data to store with that token
 *
 * @param data Object, data to store with the token
 * @param callback Function callback in form of fn(err, token, data)
 */
Sessions.prototype.create = function(data, callback) {
  var log = this.log;
  var redis = this.redis;

  crypto.randomBytes(48, function(ex, buf) {
    var token = buf.toString('hex');
    log.info('session.create %s', token);
    var k = _sessionKey(token);

    redis.multi()
      .set(k, JSON.stringify(data))
      .expire(k, TOKEN_TIMEOUT)
      .exec(function(err) {
        if (err) {
          callback(err);
        } else {
          callback(null, token, data);
        }
    });
  });
}

function _sessionKey(k) {
  return util.format('session:%s', k);
}
