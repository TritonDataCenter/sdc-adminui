module.exports = {
  simulateLatency: function() {
    return function(req, res, next) {
      if (req.path.indexOf('/_/') !== -1) {
        setTimeout(function() {
          return next();
        }, Math.floor((Math.random() * 150) + 50));
      } else {
        return next();
      }
    };
  }
}
