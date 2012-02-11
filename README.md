# Lively Kernel

For general information about the Lively Kernel, see http://lively-kernel.org/.

This repository is a fork of the Lively Kernel Webwerkstatt repository at HPI (http://www.lively-kernel.org/repository/webwerkstatt/). We want to use it in order to

- reorganize the code
- modularize the code
- fix bugs without keeping others from doing their work
- be able to create stable milestones instead of rolling releases

Changes in this repository are likely to be ported back to Webwerkstatt.

In /apache_config you can find sample config files for Apache. Soon there will be more documentation on how to install Lively locally on different systems. We are also considering alternative deployment options besides Apache.


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
