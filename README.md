# Lively Kernel

Lively Kernel is a web-based runtime and development environment that makes creation of web applications much more immediate and direct. Please see [lively-kernel.org](http://lively-kernel.org/) for more general information about the Lively Kernel project.

For feedback, announcements and discussions, please feel invited to subscribe to our [mailing list](http://lively-kernel.org/list/index.html).

Integration status of the master branch using [Travis-CI](http://www.travis-ci.org): [![Build Status](https://secure.travis-ci.org/LivelyKernel/LivelyKernel.png?branch=master)](http://travis-ci.org/LivelyKernel/LivelyKernel)

## Installation

To use Lively you do not have to install anything. The [Lively Web environment](http://lively-web.org/) is an
online wiki and development platform that can be used by everyone who wants
to experiment and develop with Lively.

If you want to run your own Lively Kernel server or contribute to the core
development then make sure you have [node.js installed](http://nodejs.org/download/) and follow the steps below.

_Windows users: On windows some of the node.js dependencies won't install cleanly. Please consider to use [this package](http://lively-kernel.org/other/lively-core-install/LivelyWeb.windows.latest.zip). Just unzip the package and start `start-lively-server.cmd`._

1. Checkout this repository,
2. start the server:

```sh
$ git clone https://github.com/LivelyKernel/LivelyKernel
$ cd LivelyKernel
$ npm start
```

Lively should now be running at [localhost:9001](http://localhost:9001/welcome.html).

## Running the tests

Start the server then run `$ npm test`.

## Contributing

Please have a look at this [wiki page](https://github.com/LivelyKernel/LivelyKernel/wiki/Git-Github-Hints) for our conventions on how to work with git and github.

All code is published under the [MIT license](https://github.com/LivelyKernel/LivelyKernel/blob/master/LICENSE).
