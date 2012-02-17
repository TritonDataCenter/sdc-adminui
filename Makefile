# Copyright (c) 2012, Joyent, Inc. All rights reserved.
#
#

.PHONY: test
test:


.PHONY: check
check: tools/jsstyle

tools/jsstyle:
	@echo "Downloading jsstyle"
	curl https://raw.github.com/davepacheco/jsstyle/master/jsstyle -o ./tools/jsstyle
