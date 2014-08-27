<!--
    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.
-->

<!--
    Copyright (c) 2014, Joyent, Inc.
-->

# adminui Changelog

## 1.0.7 (unreleased)

- ``ADMINUI-1492`` Fixes an issue where updating a network does not update view with changes
- ``ADMINUI-1490`` Private network are now shown on user details page
- ``ADMINUI-1489`` Should provide ability to search users by company
- ``ADMINUI-1488`` Improved packages view so that it caches the initial packages fetch for subsequent searches
- ``ADMINUI-1369`` Added ability to edit networks
- ``ADMINUI-1473`` Fixes possible UI rendering glitch after updating existing limits entries
- ``ADMINUI-1472`` Add SNGL as available brand for VM provisioning 
- ``ADMINUI-1465`` Fixes an issue (OSX) where the ssh keys container does not show scrollbars until users scroll
- ``ADMINUI-1441`` Added ability to configure boot param defaults for servers
- ``ADMINUI-1460`` fixes an issue that prevents package updates
- ``ADMINUI-1458`` hostname search now matches any part of string
- ``ADMINUI-1456`` Fixes vm filtering on user details page:wq
- ``ADMINUI-1448`` Jobs lists now display a summary of updates in vm update jobs
- ``ADMINUI-1453`` Jobs page now allows filtering by name
- ``ADMINUI-1443`` It is now possible to configure provisioning networking presets
- ``ADMINUI-1451`` Fixes an issue where an operator is unable to remove a network from a network pool
- ``ADMINUI-1445`` Server list view now shows memory consumption information for each node
- ``ADMINUI-1428`` VM Metadata editor rewritten to be able to edit the entire metadata object before saving

## 1.0.6

- ``ADMINUI-1435`` Fixes an issue about owner_uuids when editing network pools
- ``ADMINUI-1442`` Fixes an issue where setting custom hostname during server setup doesn''t get passed through
- ``ADMINUI-1436`` Fixes an issue where the jobs page doesn''t have paging
- ``ADMINUI-1434`` Fixes an issue where recently imported images are not immediately available for provisoning
- ``ADMINUI-1433`` sdc and platform version for servers are now displayed on server list
- ``ADMINUI-1431`` Fixes an issue where destructive actions are not showing up for CNs
- ``ADMINUI-1374`` VM Nics list now includes network name and abilty to view network details
- ``ADMINUI-1429`` Fixed issue where nic jobs causes VM details jobs list not render properly
- ``ADMINUI-1420`` ability to create firewall rules
- ``ADMINUI-1421`` ability to enable/disable firewall rules
- ``ADMINUI-1422`` ability to delete a firewall rule
- ``ADMINUI-1423`` abiilty to edit firewall rule
- ``ADMINUI-1410`` Fixes an issue where adminui does not reconnect to UFDS on headnode reboot

## 1.0.5

- ``ADMINUI-1417`` Firewall rules are now shown on vm details page
- ``ADMINUI-1415`` When changing views, adminui now scrolls you to top of page automatically
- ``ADMINUI-1310`` Display image name on vms list and allow filtering by image name
- ``ADMINUI-1150`` Role based access control (currently supports roles: readers, operators)
- ``ADMINUI-1406`` Fixes Cloud Analytiics rendering issues in Firefox
- ``ADMINUI-1149`` Users now in the "readers" group have access to adminui in read-only mode
- ``ADMINUI-1407`` Can now assign user to the read-only operator group
- ``ADMINUI-1301`` User details page vms can now be filtered by alias, status, and server uuid


## 1.0.4

- ``ADMINUI-1399`` Fixes issue in alarms dashboard tile where it may says no alarms when are indeed alarms
- ``ADMINUI-1295`` Provision screen now shows basic information about the selected user
- ``ADMINUI-1228`` Provision screen now allows operators to specify the primary network used
- ``ADMINUI-1343`` Job Progress View "raw output" toggle has been replaced with a button that takes you to the job details view
- ``ADMINUI-1309`` VM listings now include VM's IP addresses
- ``ADMINUI-1388`` Hostname searches are now no longer case case sensitive
- ``ADMINUI-1397`` Fixes Cloud Analytics not able to predicate on metrics
- ``ADMINUI-1400`` Fixes filtering servers by hostname
- ``ADMINUI-1398`` Fixes fingerprint typo on users -> ssh keys
- ``ADMINUI-1404`` Server page searches that return no results no longer stay in loading state

## 1.0.3

- ``ADMINUI-1394`` link version number in header to changelog file
- ``ADMINUI-1387`` network pool creation owner assignment now working again
- ``ADMINUI-1386`` network creation owner assignment now working again
- ``ADMINUI-1385`` network details view now shows owners
- ``ADMINUI-1391`` image import now uses workflow job progres
- ``ADMINUI-1389`` adminui no longer allows creating a VM with incorrect image for brand
- ``ADMINUI-1378`` image search suggestions dropdown does not show enough results
- ``ADMINUI-1393`` display adminui package version on header
- ``ADMINUI-1392`` display current utc time on page
- ``ADMINUI-1390`` app-wide display timestmaps in UTC instead of local time
- ``ADMINUI-1378`` image search suggestions dropdown does not show enough results
- ``ADMINUI-1389`` adminui should not allow creating a VM with incorrect dataset for brand
- ``ADMINUI-1391`` image import should consume new importRemoteImage endpoint that uses workflow
- ``ADMINUI-1342`` Provision button greyed out after filling all fields
