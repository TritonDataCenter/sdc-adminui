/*
 * Packages
 */

 var typify = require('./typify');
 module.exports = {
	// max_physica
	//  uuid: 1,                
	// name: 1,
	// version: 1,
	// 'default': 1,
	// max_physical_memory: 1,
	// quota: 1,
	// max_swap: 1,
	// cpu_cap: 1,
	// max_lwps: 1,
	// zfs_io_priority: 1,
	// active: 1
	// vcpus
  	add: function(req, res, next) {
  		req.sdc.package.add(req.body, function(err, pkg) {
  			if (err) {
  				return next(err);
  			} else {
  				res.send(typify(pkg));
  			}
  		});
  	},

  	del: function(req, res, next) {
  		req.sdc.pacakge.del(req.params.uuid, function(err, pkg) {
  			if (err) {
  				return next(err);
  			} else {
  				res.send(pkg);
  			}
  		});
  	},

  	list: function(req, res, next) {
  		req.sdc.package.list(function(err, packages) {
  			if (err) {
  				return next(err);
  			} else {
  				res.send(typify(packages));
  			}
  		});
  	}
}