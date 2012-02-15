# Lively Kernel

For general information about the Lively Kernel, see http://lively-kernel.org/.

This repository is a fork of the Lively Kernel Webwerkstatt wiki at HPI (http://www.lively-kernel.org/repository/webwerkstatt/). We want to use it in order to

- modularize and reorganize the core code
- implement a workflow that integrates the explorative and self-sustaining approach of Lively with the ability to provide maintainability and isolated feature development, i.e.
    - fix bugs without keeping others from doing their work
    - reuse modules from Lively for other projects
    - be able to create stable milestones instead of rolling releases
    - run Webwerkstatt against those artifacts
- modernize Lively Kernel's infrastructure and explore new technology

Changes in this repository are likely to be ported back to Webwerkstatt.


## Running Lively Kernel with node.js

### Requirements

First you need [node.js](http://nodejs.org/). Then you need [npm](http://npmjs.org/), the "Node Package Manager". Install npm with: `curl http://npmjs.org/install.sh | sh`

### Installation

Clone the Lively Kernel repository.

    git clone git@github.com:rksm/LivelyKernel.git ~/LivelyKernel

Then initialize the project dependencies. Currently we are using [express.js](http://expressjs.com/) for file serving.

    cd ~/LivelyKernel
    npm install

### Running Lively

Now you can start the server with

    make start_mini_server

and visit [blank.xhtml](http://localhost:9001/blank.xhtml) to start a minimal version of Lively Kernel.


## Running Lively Kernel with apache

In /apache_config you can find sample config files for Apache. Soon there will be more documentation on how to install Lively locally on different systems.


## Running the tests

### Command line tests

Note: Make sure you have all required node.js modules installed. Run `npm install` to do so.
To start the Lively tests from the command line first start the server:

    make start_server

To initiate a test run do

    make run_kernel_tests

#### How it works

The mini server provides a HTTP interface for running and reporting tests. When a new test run is requested, a Chrome instance is started and a URL to a Lively Kernel world opened. Alongside are passed queries that will the world instruct to load a test script that is executed as soon as the world is loaded.

A test run is requested by POSTing to <http://localhost:9001/test-request>.

This will by default open the world <http://localhost:9001/testing/run_tests.xhtml> and run the script `testing/run_tests.js`. The server will also add an id parameter that is later used for reporting. `run_tests.js` determines what tests should be loaded, how to run them, and how the reporting happens.

By default, a POST request to <http://localhost:9001/test-report> will inform the server about results and close the browser session (if the browser was started from inside the server).

To try it out manually visit: <http://localhost:9001/testing/run_tests.xhtml?testRunId=1&loadScript=run_tests.js&stayOpen=true>


## Working with github and the git repository

Please that [wiki page](https://github.com/rksm/LivelyKernel/wiki/Git-Github-Hints) for some best practices.
