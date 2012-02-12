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

**TODO**



## Working with the git repository

The reason for creating this repository was to have freedom for experiments, so feel free to try out stuff. Below are a few tips that are useful.

### Branching and merging

The following workflow can be used to merge a branch into master. It's a bit complex but will only create merge commits that really merge features.

    git checkout master
    git pull --rebase

We use `--rebase` so that we don't create a merge commit if local changes exist. Now update your branch:

    git co my_fancy_branch
    git rebase master

Again rebasing for not creating a merge commit. If a conflict occurs fix it and do `git rebase --continue`. Then merge normally using github or

    git co master
    git merge my_fancy_branch
