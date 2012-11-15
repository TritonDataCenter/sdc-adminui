/*jsl:import visConfig.js.sample*/

var Updater = function(options) {

  var pending = {}; // expected to be double-keyed map of [uri, timestamp]
  var queue = [];
  var timer;
  var frequency = 1000;
  var currently = 0;
  var createURI = visConfig.uriGenerator || function(inst) { return visConfig.proxyPath + inst.id; };

  this.updateItems = {};
  this.concurrent = 3;
  this.serverTime = 0;

  // creates an entry on the pending list
  // TODO: really, this should be keyed by some combination of the
  // params.  Might have to do it by providing another hook?
  // TODO: can cache results based on the same key? Useful for pause().
  function enqueue(uri, timestamp, queuedReq) {
    if (!pending[uri]) {
      pending[uri] = {};
    }
    pending[uri][timestamp] = queuedReq;
    queue.push(queuedReq);
  }

  function cutqueue(uri, timestamp, queuedReq) {
    if(!pending[uri]) {
      pending[uri] = {};
    }
    pending[uri][timestamp] = queuedReq;
    queue.unshift(queuedReq);
  }

  // removes an entry from the pending list
  function dequeue(uri, timestamp) {
    if (pending[uri][timestamp]) {
      delete pending[uri][timestamp];
    }
  }

  function isPending(uri, timestamp) {
    return pending[uri] && pending[uri][timestamp];
  }

  // Removes an instrumentation from the update list.
  // TODO: remove from queue as well?
  Updater.prototype.remove = function remove(inst) {
    var uri = createURI(inst);
    this.clearQueue(uri);
    delete this.updateItems[uri];
  };

  // Adds an instrumentation to retrieve by tick.
  // TODO: needs the params hook here? or in the actual call?
  Updater.prototype.bindVisualization = function(inst, success, error, paramHook) {
    var uri = createURI(inst);
    this.updateItems[uri] = {
      instrumentation : inst,
      success : success,
      error : error,
      paramHook : paramHook
    };
    if (Object.keys(this.updateItems).length == 1) {
      this.start();
    }
  };

  // Syncs with all registered visualizations to establish server time, then
  // starts the update tick
  Updater.prototype.start = function start() {
    var upd = this;
    if (!timer) {
      var synced = 0;
      // sync over all objects, just to be thorough, then start ticking.
      Object.keys(upd.updateItems).forEach(function(uri, i, arr) {
        upd.syncTime(uri, function() {
          if (++synced == arr.length) {
            timer = setInterval(tick.bind(upd), frequency);
          }
        });
      });
    }
  };

  // Stops the update tick
  Updater.prototype.stop = function stop() {
    timer = clearInterval(timer);
  };

  // Fetches the most recent datum available from the server (in seconds),
  // and calculates the offset from local time.
  // TODO: needs to handle granularity > 1s
  Updater.prototype.syncTime = function syncTime(uri, callback) {
    var upd = this;
    var updateItem = this.updateItems[uri];
    var url = updateItem.paramHook().url;

    $.ajax({
      url: url,
      dataType: "json",
      headers: visConfig.requestHeaders,
      success: function(d) {
        var serverTime = d.start_time + d.duration;
        if (serverTime > upd.serverTime) upd.serverTime = serverTime;
        if (callback) callback();
      },
      error: function(e) {
        console.log("Error Fetching Value from " + url);
        console.log(e);
      }
    });
  };

  // Clears the queue of any pending requests for a given uri.  This is
  // necessary with some changes to vis parameters, e.g., duration of
  // heatmaps.
  // ajaxReq.url will be one of the instrumentation uris (don't know which, though).
  Updater.prototype.clearQueue = function clearQueue(uri) {
    var upd = this;
    queue = queue.filter(function(ajaxReq) {
      var matchesAnyURI = upd.updateItems[uri].instrumentation.uris.some(function(u) {
        return u.uri == ajaxReq.url;
      });
      return !matchesAnyURI;
    });
    pending[uri] = [];
  };

  // Refreshes a visualization immediately, potentially with a callback.
  Updater.prototype.refresh = function refresh(inst, callback) {
    var upd = this;
    var uri = createURI(inst);
    var updateItem = upd.updateItems[uri];
    var queueTime = new Date().getTime();

    var queuedReq = {
      updateItem : updateItem,
      ajaxParams : updateItem.paramHook.bind(updateItem, upd.serverTime),
      callback : callback,
      queueTime : queueTime
    };

    // stick it on the front of the queue
    cutqueue(uri, queueTime, queuedReq);
    // consume it immediately (if possible)
    upd.consumePending();
  };

  // every tick, add new values to the pending list for each instrumentation.
  var tick = function() {
    var upd = this;
    upd.serverTime += 1;

    Object.keys(upd.updateItems).forEach(function(uri) {
      var updateItem = upd.updateItems[uri];
      if (upd.serverTime % updateItem.instrumentation.granularity === 0) {
        upd.makePending(uri);
      }
    });
    upd.consumePending();
  };
  // Updater.prototype.tick = tick

  // The success callback provided by the visualisation has an interface
  // of success(index, data)
  var wrapSuccessCallback = function(cb, index) {
    return function ajaxCb(data, textStatus, jqXHR) {
      cb(index, data);
    };
  };

  Updater.prototype.request = function(inst, paramHook) {
    var queueTime = new Date().getTime();
    var uri = createURI(inst);
    var updateItem = this.updateItems[uri];

    var queuedReq = {
      updateItem : updateItem,
      ajaxParams : paramHook,
      queueTime : queueTime
    };

    enqueue(uri, queueTime, queuedReq);
  };

  Updater.prototype.makePending = function(uri) {
    var upd = this;
    var updateItem = upd.updateItems[uri];
    // two timestamps involved: the serverTime for queueing, the actual time
    // requested.
    var serverTime = upd.serverTime;
    var queueTime = new Date().getTime();


    if (!isPending(updateItem.instrumentation, queueTime)) {
      // paramHook should set the url to query, and the start_time, and any
      // other information tha tmight be based on that time.  Those need
      // to happen at call time.

      var queuedReq = {
        updateItem : updateItem,
        ajaxParams : updateItem.paramHook.bind(updateItem, serverTime),
        queueTime : queueTime
      };

      enqueue(uri, queueTime, queuedReq);
    }
  };

  // decrements the concurrent request count, removes the pending item from
  // the hash, and if possible starts a new request.
  Updater.prototype.next = function(updateItem, timestamp) {
    var upd = this;
    return function complete(jqXHR, textStatus) {
      dequeue(createURI(updateItem.instrumentation), timestamp);
      // TODO: sanity-check the server time here?
      currently -= 1;
      if (currently <= upd.concurrent) {
        upd.consumePending();
      }
    };
  };

  // starts as many new requests as possible given the settings for concurrent
  // requests and the current request queue.
  Updater.prototype.consumePending = function() {
    var upd = this;

    while ((currently <= this.concurrent) && queue.length) {
      currently += 1;

      var queuedReq = queue.shift();
      var updateItem = queuedReq.updateItem;

      var ajaxParams = queuedReq.ajaxParams();
      ajaxParams.traditional = true;
      ajaxParams.dataType = 'json';
      ajaxParams.success = wrapSuccessCallback(updateItem.success, queuedReq.queueTime);
      if (queuedReq.callback) {
        ajaxParams.success = [ajaxParams.success, queuedReq.callback];
      }
      ajaxParams.error = updateItem.error;
      ajaxParams.headers = visConfig.requestHeaders;
      ajaxParams.complete = upd.next(updateItem, queuedReq.queueTime);

      // make request.
      $.ajax(ajaxParams);
    }
  };
};

