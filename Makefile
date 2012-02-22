
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
start_server:
	@ echo "minimal server starting: http://localhost:$(MINISERVER_PORT)/"
	$(NODEMON) --watch $(MINISERVER_DIR) $(MINISERVER) $(MINISERVER_PORT)

server_tests:
	$(RUN_MINISERVER_TESTS)

# wathes for file changes and reruns tests
server_tests_continuously:
	$(NODEMON) --watch $(MINISERVER_DIR) --exec $(RUN_MINISERVER_TESTS)


#######################
# lively kernel tests #
#######################
TEST_SCRIPTS = $(shell find ./testing/*.js)
CLI_TEST_STARTER = ./testing/run_lively_tests_cli.js
kernel_tests:
	node $(CLI_TEST_STARTER)

kernel_tests_continuously:
	$(NODEMON) --watch ./testing/ --watch ./core/ $(CLI_TEST_STARTER)

kernel_tests_chrome:
	node $(CLI_TEST_STARTER) -b chrome

kernel_tests_continuously_chrome:
	$(NODEMON) --watch ./testing/ --watch ./core/ $(CLI_TEST_STARTER) -b chrome

kernel_tests_firefox:
	node $(CLI_TEST_STARTER) -b firefox

kernel_tests_continuously_firefox:
	$(NODEMON) --watch ./testing/ --watch ./core/ $(CLI_TEST_STARTER) -b firefox

##########
# jshint #
##########

JSHINT = ./node_modules/jshint/bin/hint
JSHINT_CONFIG = ./jshint.config
JSHINT_INPUT = $(MINISERVER_FILES) $(MINISERVER_TEST_FILES) $(TEST_SCRIPTS)
RUN_JSHINT = $(JSHINT) $(JSHINT_INPUT) --config $(JSHINT_CONFIG)

jshint:
	$(RUN_JSHINT)

jshint_watch:
	$(NODEMON) --exec $(RUN_JSHINT)


#######################
# PartsBin (optional) #
#######################
install_partsbin:
	svn co http://lively-kernel.org/repository/webwerkstatt/core/PartsBin/ PartsBin

update_partsbin:
	cd PartsBin && svn up

#############
# Travis-CI #
#############

install_chrome_travis:
	sudo apt-get install chromium-browser

start_server_forever:
	./node_modules/forever/bin/forever start minimal_server/serve.js