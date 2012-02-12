
######################
# stuff thats needed #
######################

REL_PATH = sed "s/.*/.\/&/"
QUNIT = ./node_modules/qunit/bin/cli.js
NODEMON = ./node_modules/nodemon/nodemon.js


#################################################
# minimal server to run lively and lively tests #
#################################################

MINISERVER = ./minimal_server/serve.js
MINISERVER_PORT = 9001

MINISERVER_DIR = ./minimal_server
MINISERVER_FILES = $(shell find $(MINISERVER_DIR)/*.js | grep -v "_test.js")
MINISERVER_TEST_FILES = $(shell find $(MINISERVER_DIR)/*_test.js | $(REL_PATH))
RUN_MINISERVER_TESTS = $(QUNIT) --code $(MINISERVER_FILES) --tests $(MINISERVER_TEST_FILES)

# watches for file changes and restarts server
start_mini_server:
	@ echo "minimal server starting: http://localhost:$(MINISERVER_PORT)/"
	$(NODEMON) --watch $(MINISERVER_DIR) $(MINISERVER) $(MINISERVER_PORT)

mini_server_tests:
	$(RUN_MINISERVER_TESTS)

# wathes for file changes and reruns tests
mini_server_tests_watch:
	$(NODEMON) --watch $(MINISERVER_DIR) --exec $(RUN_MINISERVER_TESTS)


##########
# jshint #
##########

JSHINT = ./node_modules/jshint/bin/hint
JSHINT_CONFIG = ./jshint.config
RUN_JSHINT = $(JSHINT) $(MINISERVER_FILES) $(MINISERVER_TEST_FILES) --config $(JSHINT_CONFIG)

jshint:
	$(RUN_JSHINT)

jshint_watch:
	$(NODEMON) --exec $(RUN_JSHINT)
