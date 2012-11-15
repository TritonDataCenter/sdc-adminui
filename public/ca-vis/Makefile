#
# Tools and arguments
#
JSL		= tools/jsl
JSL_ARGS	= --nologo --nofilelisting --conf=$(JSL_CONF)
JSL_CONF	= tools/jsl_support/jsl.web.conf

#
# Input files
#
JS_FILES	= demo/visConfig.js $(wildcard *.js)

#
# Targets
#
check: $(JS_FILES)
	$(JSL) $(JSL_ARGS) $(JS_FILES)

.PHONY: check
