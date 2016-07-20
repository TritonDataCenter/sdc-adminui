#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#

#
# Copyright (c) 2014, Joyent, Inc.
#

#
# Makefile: basic Makefile for template API service
#
# This Makefile is a template for new repos. It contains only repo-specific
# logic and uses included makefiles to supply common targets (javascriptlint,
# jsstyle, restdown, etc.), which are used by other repos as well. You may well
# need to rewrite most of this file, but you shouldn't need to touch the
# included makefiles.
#
# If you find yourself adding support for new targets that could be useful for
# other projects too, you should add these to the original versions of the
# included Makefiles (in eng.git) so that other teams can use them too.
#

#
# Tools
#
MOCHA_PHANTOMJS	:= ./node_modules/.bin/mocha-phantomjs

#
# Files
#
JS_FILES	:= $(shell ls *.js) $(shell find lib test -name '*.js')
JSL_CONF_NODE	 = tools/jsl.node.conf
JSL_FILES_NODE   = $(JS_FILES)
JSSTYLE_FILES	 = $(JS_FILES)
JSSTYLE_FLAGS    = -o "indent=2,doxygen,unparenthesized-return=0,line-length=120"

REPO_MODULES	 =
SMF_MANIFESTS_IN = smf/manifests/adminui.xml.in

NODE_PREBUILT_VERSION=v0.10.40
NODE_PREBUILT_TAG=zone
NODE_PREBUILT_IMAGE=fd2cc906-8938-11e3-beab-4359c665ac99



include ./tools/mk/Makefile.defs
ifeq ($(shell uname -s),SunOS)
	include ./tools/mk/Makefile.node_prebuilt.defs
else
	include ./tools/mk/Makefile.node.defs
endif
include ./tools/mk/Makefile.smf.defs

ROOT            := $(shell pwd)
RELEASE_TARBALL := adminui-pkg-$(STAMP).tar.bz2
RELSTAGEDIR          := /tmp/$(STAMP)


#
# Repo-specific targets
#

JS_BUNDLE = ./www/app.js
JS_BUNDLE_FILES	:= $(shell find www/js -name '*.js' -o -name '*.hbs')
JS_BUNDLE_FILES	+= ./tools/build-js


.PHONY: all
all: $(SMF_MANIFESTS) node_modules js sdc-scripts

.PHONY: dev
dev: node_modules_dev sdc-scripts

.PHONY: node_modules
node_modules: | $(NPM_EXEC)
	$(NPM) install --production

node_modules_dev: | $(NPM_EXEC)
	@echo "Installing NPM deps"
	$(NPM) install

CLEAN_FILES += ./node_modules $(JS_BUNDLE)

.PHONY: js
js: $(JS_BUNDLE)

$(JS_BUNDLE): $(JS_BUNDLE_FILES) | $(NODE_EXEC)
	@echo "Building js bundle"
	MINIFY=true $(NODE) tools/build-js | bunyan


.PHONY: devrun
devrun:
	@./tools/devrun.sh

.PHONY: test
test: | $(JS_BUNDLE)
	$(NPM) test


.PHONY: release
release: all deps docs $(SMF_MANIFESTS)
	@echo "Building $(RELEASE_TARBALL)"
	@mkdir -p $(RELSTAGEDIR)/root/opt/smartdc/adminui
	@mkdir -p $(RELSTAGEDIR)/site
	@touch $(RELSTAGEDIR)/site/.do-not-delete-me
	cp -r $(ROOT)/* $(RELSTAGEDIR)/root/opt/smartdc/adminui/
	rm $(RELSTAGEDIR)/root/opt/smartdc/adminui/image-version.json
	@echo "{\"version\": \"$(STAMP)\"}" >> $(RELSTAGEDIR)/root/opt/smartdc/adminui/image-version.json
	rm -rf $(RELSTAGEDIR)/root/opt/smartdc/adminui/deps
	mkdir -p $(RELSTAGEDIR)/root/opt/smartdc/boot
	cp -R $(ROOT)/deps/sdc-scripts/* $(RELSTAGEDIR)/root/opt/smartdc/boot/
	cp -R $(ROOT)/boot/* $(RELSTAGEDIR)/root/opt/smartdc/boot/
	(cd $(RELSTAGEDIR) && $(TAR) -jcf $(ROOT)/$(RELEASE_TARBALL) root site)
	@rm -rf $(RELSTAGEDIR)


.PHONY: publish
publish: release
	@if [[ -z "$(BITS_DIR)" ]]; then \
		echo "error: 'BITS_DIR' must be set for 'publish' target"; \
		exit 1; \
	fi
	mkdir -p $(BITS_DIR)/adminui
	cp $(ROOT)/$(RELEASE_TARBALL) $(BITS_DIR)/adminui/$(RELEASE_TARBALL)



include ./tools/mk/Makefile.deps
include ./tools/mk/Makefile.targ
ifeq ($(shell uname -s),SunOS)
	include ./tools/mk/Makefile.node_prebuilt.targ
else
	include ./tools/mk/Makefile.node.targ
endif
include ./tools/mk/Makefile.smf.targ

sdc-scripts: deps/sdc-scripts/.git
