module.exports = {
    listDatacenters: function(req, res, next) {
        // sdc-ldap search -s one -b 'o=smartdc' '(objectclass=datacenter)'
        req.ufdsMaster.search('o=smartdc', {
            filter: '(objectclass=datacenter)',
            scope: 'one'
        }, function(err, datacenters) {
            if (err) {
                req.log.error(err, 'Error fetching datacenters');
                return next(err);
            }
            datacenters = datacenters.map(function(dc) {
                return {
                    address: dc.address,
                    company: dc.company,
                    datacenter: dc.datacenter
                };
            });


            res.send(datacenters);
            return next();
        });
    }
};
