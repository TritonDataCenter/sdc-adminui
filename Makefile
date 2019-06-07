#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#

#
# Copyright (c) 2019, Joyent, Inc.
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
NAME		:= adminui

#
# Files
#
JSL_CONF_NODE	 = tools/jsl.node.conf
JSL_CONF_WEB	 = tools/jsl.web.conf
JSL_FILES_NODE	 = $(shell ls *.js) $(shell find lib tools -name '*.js')
JSL_FILES_WEB	 = $(shell find www/js -name '*.js' | grep -v www/js/lib)
JSSTYLE_FILES	 = $(JSL_FILES_NODE)
JSSTYLE_FLAGS	 = -o "indent=2,doxygen,unparenthesized-return=0,line-length=120"

REPO_MODULES	 =
SMF_MANIFESTS_IN = smf/manifests/adminui.xml.in

NODE_PREBUILT_VERSION=v6.17.0
ifeq ($(shell uname -s),SunOS)
	NODE_PREBUILT_IMAGE=c2c31b00-1d60-11e9-9a77-ff9f06554b0f
	NODE_PREBUILT_TAG=zone64
endif

ENGBLD_USE_BUILDIMAGE	= true
ENGBLD_REQUIRE		:= $(shell git submodule update --init deps/eng)
include ./deps/eng/tools/mk/Makefile.defs
ifeq ($(shell uname -s),SunOS)
	include ./deps/eng/tools/mk/Makefile.node_prebuilt.defs
	include ./deps/eng/tools/mk/Makefile.agent_prebuilt.defs
else
	include ./deps/eng/tools/mk/Makefile.node.defs
endif
include ./deps/eng/tools/mk/Makefile.smf.defs


#
# Variables
#

# Mountain Gorilla-spec'd versioning.

ROOT            := $(shell pwd)
RELEASE_TARBALL := $(NAME)-pkg-$(STAMP).tar.gz
RELSTAGEDIR          := /tmp/$(NAME)-$(STAMP)

BASE_IMAGE_UUID = a9368831-958e-432d-a031-f8ce6768d190
BUILDIMAGE_NAME = $(NAME)
BUILDIMAGE_DESC	= SDC AdminUI
AGENTS		= amon config registrar

#
# Repo-specific targets
#

JS_BUNDLE = ./www/app.js
JS_BUNDLE_FILES	:= $(shell find www/js -name '*.js' -o -name '*.hbs')
JS_BUNDLE_FILES	+= ./tools/bundle.js


.PHONY: all
all: $(SMF_MANIFESTS) node_modules js sdc-scripts

.PHONY: dev
dev: node_modules_dev sdc-scripts

.PHONY: node_modules node_modules_dev
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
	MINIFY=true $(NODE) tools/bundle.js | bunyan

.PHONY: devrun
devrun:
	@./tools/devrun.sh

.PHONY: test
test: | $(JS_BUNDLE)
	$(NPM) test


.PHONY: release
release: all deps docs $(SMF_MANIFESTS)
	@echo "Building $(RELEASE_TARBALL)"
	mkdir -p $(RELSTAGEDIR)/root/opt/smartdc/$(NAME)
	mkdir -p $(RELSTAGEDIR)/site
	touch $(RELSTAGEDIR)/site/.do-not-delete-me
	cp -r \
		$(ROOT)/bootstrap \
		$(ROOT)/etc \
		$(ROOT)/less \
		$(ROOT)/lib \
		$(ROOT)/LICENSE \
		$(ROOT)/node_modules \
		$(ROOT)/package.json \
		$(ROOT)/README.md \
		$(ROOT)/sapi_manifests \
		$(ROOT)/server.js \
		$(ROOT)/smf \
		$(ROOT)/views \
		$(ROOT)/www \
		$(RELSTAGEDIR)/root/opt/smartdc/$(NAME)/
	mkdir -p $(RELSTAGEDIR)/root/opt/smartdc/$(NAME)/build
	cp -PR \
		$(TOP)/build/node \
		$(RELSTAGEDIR)/root/opt/smartdc/$(NAME)/build
	@echo "{\"version\": \"$(STAMP)\"}" > $(RELSTAGEDIR)/root/opt/smartdc/$(NAME)/image-version.json
	mkdir -p $(RELSTAGEDIR)/root/opt/smartdc/boot
	cp -R $(ROOT)/deps/sdc-scripts/* $(RELSTAGEDIR)/root/opt/smartdc/boot/
	cp -R $(ROOT)/boot/* $(RELSTAGEDIR)/root/opt/smartdc/boot/
	(cd $(RELSTAGEDIR) && $(TAR) -I pigz -cf $(ROOT)/$(RELEASE_TARBALL) root site)
	@rm -rf $(RELSTAGEDIR)


.PHONY: publish
publish: release
	mkdir -p $(ENGBLD_BITS_DIR)/$(NAME)
	cp $(ROOT)/$(RELEASE_TARBALL) $(ENGBLD_BITS_DIR)/$(NAME)/$(RELEASE_TARBALL)


include ./deps/eng/tools/mk/Makefile.deps
include ./deps/eng/tools/mk/Makefile.targ
ifeq ($(shell uname -s),SunOS)
	include ./deps/eng/tools/mk/Makefile.node_prebuilt.targ
	include ./deps/eng/tools/mk/Makefile.agent_prebuilt.targ
else
	include ./deps/eng/tools/mk/Makefile.node.targ
endif
include ./deps/eng/tools/mk/Makefile.smf.targ

sdc-scripts: deps/sdc-scripts/.git
