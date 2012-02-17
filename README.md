# Admin UI

Repository: <git@git.joyent.com:adminui.git> 
Browsing: <https://mo.joyent.com/adminui> 
Who: Kevin Chan Docs: 
Tickets/bugs: <https://devhub.joyent.com/jira/browse/ADMINUI>

# Overview

# Repository

# Development

# Testing

    make test

# Design

AdminUI is being rewritten in node for several reasons. Those include:
 * Multiple APIs highlights the need for concurrent requests
 * The reliance on many APIs and a lack of old MAPI backend means a rewrite is
   required. This is easier than writing a MAPI shim
 * The old AdminUI did not present data in a meaningful way at scale (ie lists
   are useless when you have 10,000 vms)
 * Simplifies stack (eliminate caproxy/consoleproxy/etc)
 * Allows the addition of realtime notifications via the UI
 * JS everywhere
 * Escape gem hell (and embrace npm limbo)

Features include:

 * UFDS Editor for Groups / Users / etc
 * Dataset API Browser
 * Configuration Browser (its unclear where configs will be stored, but my hope
   is we'll agree on a config DN and use UFDS)
 * AdminUI must be able to configure itself through AdminUI. This means that
   launching AdminUI without a config should not result in a broken AdminUI, but
   should instead print a message saying "to configure auth edit this file and
   relaunch". This is a minor nit-pick but its important that any tuning of
   endpoints happen through the app itself - not another config file.
 * Search is the major method of navigating. This suggests a common search
   pattern requirement across APIs, like what CA has, but it's not a
   requirement. QL.IO is useful to look at for inspiration here.
   Search means being able to start typing in: 
     - username
     - email address
     - uuid (regardless of type)
     - dataset URN
     - IP address / MAC address
 * Old pages still required:
     - Networks page (we may still use a list)
     - Network details page
     - Nic Tags 
     - Platform Images 
     - VM Details page
     - Image/Dataset details page
     - Image/Dataset browser
     - UFDS browser
     - DN Details page
     - DN Config wizard (we need to talk about how this will work)
     - Package Editor (packages stored in UFDS - we need to pick a DN w/ cavage)

New Features may include:

 * Realtime notifications system. Possibly integrated with AMON. For example:
    - A CN becomes unavailable - anyone in AdminUI should be immediately notified 
    - Actions performed by other administrators (possible feed of these but
      thats another story)
    - If another support person / administrator is currently on the same
      resource as the person using the interface, then you should see a message
      saying "one other person is viewing this page" which will tell you who it
      is. This way, you can attempt to avoid having multiple people perform
      actions on a machine
    - Real time status updates on resources. If a machine transitions state from
      "setting up" to "running" we should try and update people without
      reloading the page like its 2004.
    - If the machine details have been changed prior to someone attempting to
      make a change, then they can be notified (we can set dirty 'state' on
      resource)

Implementation plan:

 * The old design can go away - do not hold onto the past
 * Twitter bootstrap to start - this will give us a common toolkit we can pass
   to a UI/UX person when we feel we need to modify something heavily - but also
   lets us do adminui customizations much much easier
 * Start with UFDS integration - as this is one of the few new APIs available
   and is less likely to change. Focus on Groups/Users/Customers. 

# TODO

