# Design / Stories / Requirements 

This page outlines features and design ideas for the different bits and pieces
of adminUI functionality. 

## Browser Support

 * Firefox
 * Chrome
 * IE9+

## Dashboard

 * Dashboard should visualize:
   - Number of running machines groupd by packages
   - Number of running machines grouped by image
   - Number of Workflows per day stacked with failures on top
   - Scatter plot of utilization of compute nodes in the entire DC
   - Recent workflows (?)
   - Realtime ticker for total number of machines

## Machines

 * Lists should be avoided unless we can reduce scope considerably (ie
   restricted to a per CN or per Customer view)
 * When lists are in use should be able to sort machines by status
 * Console access is available to all administrators for all machines, (both vm
    and zone)
 * Operators should be able to disable MAC and IP anti-spoof on a machine
 * Operations should be able to provision machines on behalf of any user
 * Machine provisions should allow user-specifiable keys / overrides
 * Provisioning should check dataset requirements (mix/max)
 * machine details should show which dataset the machine is running
 * machine details should show if the dataset is still available / deleted
 * 

## Networks

## Customers

 * Should be able to add / edit / see customer limits plugins (need details)
 * Operator should be able to tag customers in UFDS
 * Customer details should show all IP addresses "owned" by that customer
 * Customer labels should be "family name" and "given name"
 * Operators should be able to comment on customers. hidden from customer.

## Images

 * If it is possible for an import to become "stuck" then a cancel operation
   should be available to the operator
 * Should provide an interface for browsing the DSAPI endpoints
 * Should support more than one DSAPI endpoint
 * Should provide an interface for adding / removing DSAPI endpoints

## Platform

 * Operators should be able to see a list of available platform images
 * Operators should be which compute nodes are running which images
 * Operators should be able to select a new platform image for a compute node
 * Operators shoudl be able to select a new default platform image
 * Operators should be able to select a new platform image per server role
 * When changing any of the images, a notification is required that will ask
   "This change will affect server role(s) foo bar baz. Do you want to
   continue?"
 *  

## Compute Nodes

 * Storage should display all disks, their status (good/bad/etc), size, vendor,
 * model, type (ata/sata/sas), spindle/ssd, etc.
 * All network interfaces should be displayed with ifname, mac, speed, state,
   duplex and IPv4 and IPv6 addresses/netmasks
 * 

## Compute Nodes - Setup

 * Setting up a compute node should involve setting NIC tags and Storage Pool
 * NIC tags will probably remain the same
 * Storage is significantly simplified:
   - Pools will *always* use the default name "zpool"
   - No customized / secondary pools are allowed
   - Disk selector is necessary for pool confirugration
   - Disk information displayed includes Vendor, Device Name, Device Size, Model
     Name, Removable?, and type (ATA/SATA/SAS). 
   - The user will be able to select a "role" for a disk that will let them
     assign the disk to either the zpool / hot standby / CACHE / ZIL

## Configuration

## Search

 * Search is a significant component of AdminUI, as it will be the main method
   of interacting with the system
 * Search should be able to search ALL resources within the system by hitting
   all of the different APIs and having them return their resources
 * No drop down list for "scoping" search. It should just search all resources.
   If we need to have filters then we can create a search DSL similar to gmail.
 * Customer search should support: UUID, First name, Last name, email address
 * Search should work across all datacenters configured in the system

## Analytics

 * Operator can create instrumentations with the predicate = customer 
 * Operator can create instrumentations with the predicate = compute node
 * Operator can create instrumentations with the predicate = machine


