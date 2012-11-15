function RawDataStore(updater, inst) {
  this.updater = updater;
  this.granularity = inst.granularity || 1;
  this.arity = inst['value-arity'];
  this.data = {};
  this.latestData = 0;

  // retrieves the data at timestamp and offset.
  this.getRange = function(end_time, offset, url) {
    var selection = {};
    var startAt = end_time - end_time % this.granularity;
    var endAt = (end_time - offset + 1) + (end_time - offset) % this.granularity;

    var pending = [];

    // TODO: adjust for npoints.
    for (var i = startAt; i >= endAt; i -= this.granularity) {
      if (this.data[i]) {
        selection[i] = this.data[i];
      } else {
        this.data[i] = selection[i] = this.pending(i);
        // TODO: push missing timestamp to updater.
        pending.push(i);
      }
    }

    // check for runs, push requests.
    if (pending.length) {
      var runBounds = [0];
      pending.sort().reduce(function(acc, x, j) {
        if (x - acc > 1) runBounds.push(j);
        return x;
      });
      // for each run, push to the updater.
      runBounds.map(function(x, j, arr) {
        return pending.slice(x, arr[j+1]);
      }).forEach(function(run) {
        var paramHook = function() {
          var params = {
            url : url,
            data : {
              start_time : run[0],
              duration : this.granularity,
              ndatapoints : run.length
            }
          };
          return params;
        };

        updater.request(inst, paramHook);
      });
    }

    return selection;
  };

  // TODO: both error and success? Or separate err?
  this.add = function(datum) {
    // TODO: needs to handle an array.
    var ds = this;
    (Array.isArray(datum) ? datum : [datum]).forEach(function(d) {
      ds.data[d.start_time] = d;
      if (d.start_time > ds.latestData) ds.latestData = d.start_time;
    });
  };

  // var nullValue = {
  //   'numeric-decomposition' : function() { return {}; },
  //   'discrete-decomposition' : function() { return {}; },
  //   'scalar' : function() { return 0; }
  // };

  // TODO: interface with the updater. For now just return the pending placeholder.
  // this.pending = function(timestamp, duration) {
  //   return {
  //     status : 'pending',
  //     start_time : Math.floor(timestamp / this.granularity),
  //     duration : this.granularity,
  //     value : nullValue[this.arity]()
  //   };
  // };

  // trim data older than that timestamp (newer tends to be useful)
  this.trim = function(timestamp) {
    var ds = this;
    Object.keys(ds.data).filter(function(t) {
      return t < timestamp;
    }).forEach(function(t) {
      delete ds.data[t];
    });
  };
};



// close over nullValue for privacy.
RawDataStore.prototype.pending = function() {

  var nullValue = {
    'numeric-decomposition' : function() { return {}; },
    'discrete-decomposition' : function() { return {}; },
    'scalar' : function() { return 0; }
  };

  return function pending(timestamp, duration) {
    return {
      status : 'pending',
      start_time : Math.floor(timestamp / this.granularity),
      duration : this.granularity,
      value : nullValue[this.arity]()
    };
  };
}();

