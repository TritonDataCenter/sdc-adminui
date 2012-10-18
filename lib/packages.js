/*
 * Packages
 */
module.exports = {
	list: function(req, res, next) {
		filter = '(&(objectclass=sdcpackage))';

		if (req.params.active) {
			filter += '(active=true)';
		}
		var opts = {
			scope: 'one',
			filter: filter
		}
		req.sdc.ufds.search('ou=packages, o=smartdc', opts, function(err, packages) {
			if (err) {
				return next(err);
			}
			res.send(packages);
		});
	}
}