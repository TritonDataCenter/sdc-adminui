module.exports = {
  simulateLatency: function() {
    return function(req, res, next) {
      if (req.url.indexOf('/_/') !== -1) {
        setTimeout(function() {
          return next();
        }, Math.floor((Math.random() * 100) + 50));
      } else {
        return next();
      }
    };
  }
};