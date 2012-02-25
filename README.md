# Lively Kernel

For general information about the Lively Kernel, see [lively-kernel.org](http://lively-kernel.org/). 

For feedback, announcement and discussions, please feel invited to subscribe to our [mailing list](http://lively-kernel.org/list/index.html).


## This Repository

This repository is a fork of the Lively Kernel Webwerkstatt wiki at [HPI](http://www.lively-kernel.org/repository/webwerkstatt/). 

To learn more about the motivation and long-term vision for this repository see [the wiki](https://github.com/rksm/LivelyKernel/wiki/Repository-Purpose).


## Running Lively Kernel with node.js

### Requirements

First you need [node.js](http://nodejs.org/). Then you need [npm](http://npmjs.org/), the "Node Package Manager". Install npm with: `curl http://npmjs.org/install.sh | sh`

### Installation

Clone the Lively Kernel repository.

    git clone git@github.com:rksm/LivelyKernel.git ~/LivelyKernel

Then initialize the project dependencies. Currently we are using [express.js](http://expressjs.com/) and [nodemon](https://github.com/remy/nodemon) for file serving.

    cd ~/LivelyKernel
    npm install

### Running Lively

Now you can start the server with

    make start_server

and visit [blank.xhtml](http://localhost:9001/blank.xhtml) to start a minimal version of Lively Kernel.


## Running Lively Kernel with apache

In /apache_config you can find sample config files for Apache. Soon there will be more documentation on how to install Lively locally on different systems.


## Running the tests

### Command line tests

Note: Make sure you have all required node.js modules installed. Run `npm install` to do so.
To start the Lively tests from the command line first start the server:

    make start_server

To initiate a test run do

    make kernel_tests

This runs tests in the browser you specified in testing/config.js. Alternatively, you can use the make targets kernel_tests_firefox or kernel_tests_chrome.

#### Test options

Behind `make kernel_tests` there is the script `testing/run_lively_tests_cli.js`. Start it with

    node testing/run_lively_tests_cli.js --help

to see all available options. A few useful ones are:

- Change the browser with `-b`. We currently support `chrome` and `firefox`.
- Filter tests to run with `-f`, e.g. `-f "testframework|.*|filter"` will only run those tests that are in modules matching '"testframework' (there is just `lively.TestFramework`) and are defined in those test methods that match 'filter'. Generally, there are three parts to a filter that are interpreted as regular expressions. The first one matches modules, the second test classes, and the third test methods. You don't need to specify all parts. This makes it very easy to run focus tests.
- Output the results via a notification system lile 'growlnotify' with `-n growlnotify`.

#### How it works

The mini server provides a HTTP interface for running and reporting tests. When a new test run is requested, a Chrome instance is started and a URL to a Lively Kernel world opened. Alongside are passed queries that will the world instruct to load a test script that is executed as soon as the world is loaded.

A test run is requested by POSTing to <http://localhost:9001/test-request>.

This will by default open the world <http://localhost:9001/testing/run_tests.xhtml> and run the script `testing/run_tests.js`. The server will also add an id parameter that is later used for reporting. `run_tests.js` determines what tests should be loaded, how to run them, and how the reporting happens.

By default, a POST request to <http://localhost:9001/test-report> will inform the server about results and close the browser session (if the browser was started from inside the server).

To try it out manually visit: <http://localhost:9001/testing/run_tests.xhtml?testRunId=1&loadScript=run_tests.js&stayOpen=true>


## LivelyKernel on Travis-CI

We use [Travis-CI](http://www.travis-ci.org) to run tests continuously on every commit into the Master branch: 
[![Build Status](https://secure.travis-ci.org/rksm/LivelyKernel.png)](http://travis-ci.org/rksm/LivelyKernel)

## Working with github and the git repository

Please that [wiki page](https://github.com/rksm/LivelyKernel/wiki/Git-Github-Hints) for some best practices.


## Installing PartsBin

You can install all the cool tools from Webwerkstatt's PartsBin. Have a look at [the HOWTO](https://github.com/rksm/LivelyKernel/wiki/How-to-make-PartsBin-work).
