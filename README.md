# Lively Kernel

Lively Kernel is a web-based runtime and development environment that makes creation of web applications much more immediate and direct. Please see [lively-kernel.org](http://lively-kernel.org/) for more general information about the Lively Kernel project.

For feedback, announcement and discussions, please feel invited to subscribe to our [mailing list](http://lively-kernel.org/list/index.html).

This repository is a fork of the Lively Kernel Webwerkstatt wiki at [HPI](http://www.lively-kernel.org/repository/webwerkstatt/). To learn more about the motivation and long-term vision for this repository see [the wiki](https://github.com/rksm/LivelyKernel/wiki/Repository-Purpose).

Current build status of the master branch: [Build Status](https://secure.travis-ci.org/rksm/LivelyKernel.png)

## Installation

Get Lively Kernel *core* up and running.

### Prerequisites

1. node.js: In a terminal try running `node -v`. If that fails [install node.js](http://nodejs.org/#download).

2. npm: Try running `npm -v`. If that fails run `curl http://npmjs.org/install.sh | sh` in your terminal to install it.

### Running Lively

1. Clone the Lively Kernel repository.

    ```
    git clone git@github.com:rksm/LivelyKernel.git ~/LivelyKernel
    ```

2. Go into the Lively Kernel directory and run npm:

    ```
    cd ~/LivelyKernel
    npm install
    ```

3. In that directory start the minimal server

    ```
    lk server
    ```


That's it. You can now visit ther rather boring page [blank.xhtml](http://localhost:9001/blank.xhtml) or run the tests with `lk test`.


### Setup an apache server

*Note 1* You only need to do this if you want to run a full-fletched Lively Kernel installation that provides the functionality to run a [Lively Wiki](http://www.hpi.uni-potsdam.de/hirschfeld/projects/livelywiki/index.html).

*Note 2* We are currently working on a pure node.js solution to get rid of apache and the complicated setup process.

See [installation notes for apache on Debian and Mac OS x](https://github.com/rksm/LivelyKernel/wiki/Lively-kernel-installation-on-debian-and-mac-os-x) for details.


### Installing the Webwerkstatt PartsBin

You can install all the cool tools from Webwerkstatt's PartsBin. Have a look at [the HOWTO](https://github.com/rksm/LivelyKernel/wiki/How-to-make-PartsBin-work).


### Using livelykernel-scripts

We will shortly publish an automated installer. In the meantime you may want to try out:

```sh
npm install -g livelykernel-scripts
lk workspace --checkout-lk
echo "Lively Kernel core is now installed in `lk scripts-dir`/workspace/lk/"
lk server
```

You can now use `lk test` to run the tests and visit [blank.xhtml](http://localhost:9001/blank.xhtml).

## Running the tests

### Command line tests

Note: Make sure you have all required node.js modules installed. Run `npm install` to do so.
To start the Lively tests from the command line first start the server:

    lk server

To initiate a test run do

    lk test

This runs tests in the browser you specified in testing/config.js. See `lk test --help` for all [the test runner options](https://github.com/rksm/LivelyKernel/wiki/Lk-script-test).


### LivelyKernel on Travis-CI

We use [Travis-CI](http://www.travis-ci.org) to run tests continuously on every commit into the Master branch:
[![Build Status](https://secure.travis-ci.org/rksm/LivelyKernel.png)](http://travis-ci.org/rksm/LivelyKernel)


## Contributing

Please this [wiki page](https://github.com/rksm/LivelyKernel/wiki/Git-Github-Hints) for some best practices to work with git and github.

All code is published under the [MIT license](https://github.com/rksm/LivelyKernel/blob/master/LICENSE).
