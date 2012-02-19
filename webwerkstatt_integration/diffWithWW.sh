#!/usr/bin/env sh

WW="/Users/robert/server/webwerkstatt/core/"
CORE="/Users/robert/Dropbox/Projects/LivelyKernel/core/"

diff $CORE $WW -x ".svn" -u -r -q
