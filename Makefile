#
# Copyright (c) 2012, Joyent, Inc. All rights reserved.
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
TAP		:= ./node_modules/.bin/tap

#
# Files
#
DOC_FILES	 = index.restdown
JS_FILES	:= $(shell ls *.js) $(shell find lib test -name '*.js')
JSL_CONF_NODE	 = tools/jsl.node.conf
JSL_FILES_NODE   = $(JS_FILES)
JSSTYLE_FILES	 = $(JS_FILES)
JSSTYLE_FLAGS    = -o indent=2,doxygen,unparenthesized-return=0
REPO_MODULES	 =
SMF_MANIFESTS_IN = smf/manifests/adminui.xml.in

NODE_PREBUILT_VERSION=v0.8.20
NODE_PREBUILT_TAG=zone

include ./tools/mk/Makefile.defs
include ./tools/mk/Makefile.node_prebuilt.defs
include ./tools/mk/Makefile.node_deps.defs
include ./tools/mk/Makefile.smf.defs

ROOT            := $(shell pwd)
RELEASE_TARBALL := adminui-pkg-$(STAMP).tar.bz2
TMPDIR          := /tmp/$(STAMP)


#
# Repo-specific targets
#

JS_BUNDLE = ./public/✚.js
JS_BUNDLE_FILES	:= $(shell find public/js -name '*.js' -o -name '*.hbs')
JS_BUNDLE_FILES	+= ./tools/build-js


.PHONY: all
all: $(SMF_MANIFESTS) | $(TAP) $(REPO_DEPS) $(JS_BUNDLE)
	$(NPM) rebuild


$(TAP): | $(NPM_EXEC)
	$(NPM) install

CLEAN_FILES += $(TAP) ./node_modules/tap $(JS_BUNDLE)

.PHONY: js
js: $(JS_BUNDLE)


$(JS_BUNDLE): $(JS_BUNDLE_FILES) $(NODE_EXEC)
	@echo "Building js bundle"
	$(NODE) tools/build-js


.PHONY: dev
devrun:
	@./tools/devrun.sh

.PHONY: test
test: $(TAP)
	# TAP=1 $(TAP) test/*.test.js


.PHONY: release
release: all deps docs $(SMF_MANIFESTS)
	@echo "Building $(RELEASE_TARBALL)"
	@mkdir -p $(TMPDIR)/root/opt/smartdc/adminui
	@mkdir -p $(TMPDIR)/site
	@touch $(TMPDIR)/site/.do-not-delete-me
	cp -r $(ROOT)/* $(TMPDIR)/root/opt/smartdc/adminui/
	(cd $(TMPDIR) && $(TAR) -jcf $(ROOT)/$(RELEASE_TARBALL) root site)
	@rm -rf $(TMPDIR)


.PHONY: publish
publish: release
	@if [[ -z "$(BITS_DIR)" ]]; then \
    echo "error: 'BITS_DIR' must be set for 'publish' target"; \
    exit 1; \
  fi
	mkdir -p $(BITS_DIR)/adminui
	cp $(ROOT)/$(RELEASE_TARBALL) $(BITS_DIR)/adminui/$(RELEASE_TARBALL)



include ./tools/mk/Makefile.deps
include ./tools/mk/Makefile.node_prebuilt.targ
include ./tools/mk/Makefile.node_deps.targ
include ./tools/mk/Makefile.smf.targ
include ./tools/mk/Makefile.targ
