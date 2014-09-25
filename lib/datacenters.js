/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

module.exports = {
    listDatacenters: function (req, res, next) {
        // sdc-ldap search -s one -b 'o=smartdc' '(objectclass=datacenter)'
        req.ufdsMaster.search('o=smartdc', {
            filter: '(objectclass=datacenter)',
            scope: 'sub'
        }, function (err, datacenters) {
            if (err) {
                req.log.error(err, 'Error fetching datacenters');
                return next(err);
            }
            datacenters = datacenters.map(function (dc) {
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
