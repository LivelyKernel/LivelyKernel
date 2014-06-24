# Lively Web [![Build Status](https://secure.travis-ci.org/LivelyKernel/LivelyKernel.png?branch=master)](http://travis-ci.org/LivelyKernel/LivelyKernel)

Lively Web is browser-based runtime and development environment that makes creation of (Web) applications much more immediate and direct. All development happens "live", i.e. you change your application and the system while it is running. This is not only more fun than tedious compile/test/reload workflows but also much faster.

- See [Dan Ingall's talk from JS Conf '12](http://blip.tv/play/g_MngvTbawI.html?p=1) for a first impression.
- To get started, dive into the [interactive Lively-101 world](http://lively-web.org/users/robertkrahn/Lively-101.html).
- To get your own online workspace [follow the "How To" instructions here](http://lively-web.org/welcome.html).

## Installation

To use Lively _you do not have to install anything_. The [Lively Web environment](http://lively-web.org/) is an
online wiki and development platform that can be used by everyone who wants
to experiment and develop with Lively.

If you want to run your own Lively Web server or contribute to the core
development follow the steps below.

### Windows

1. Download [this package](http://lively-kernel.org/other/lively-core-install/LivelyWeb.windows.latest.zip).
2. Unzip it.
3. Double click / start `start-lively-server.cmd`.

### Mac OS and Linux

1. Make sure you have [node.js](http://nodejs.org/download/) installed.
2. Checkout this repository: `$ git clone https://github.com/LivelyKernel/LivelyKernel`.
2. Start the server: `$ cd LivelyKernel; npm start`

Lively should now be running at [localhost:9001](http://localhost:9001/welcome.html).

### VM distro (debian 7)

Alternatively to the install instructions above you can run Lively via VirtualBox/Vagrant. See [LivelyKernel/lively-vagrant](https://github.com/LivelyKernel/lively-vagrant/blob/master/README.md) for setup instructions.

## Running the tests

Start the server then run `$ npm test`.

## Contributing

All code is published under the [MIT license](https://github.com/LivelyKernel/LivelyKernel/blob/master/LICENSE).
