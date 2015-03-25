#!/usr/bin/env bash

DIR=`dirname $0`
UNAME=$(uname | tr '[:upper:]' '[:lower:]')
[ $UNAME = "darwin" ] && IS_DARWIN=1
[ $UNAME = "linux" ] && IS_LINUX=1

if [ -z "$WORKSPACE_LK" ]; then
  export WORKSPACE_LK=$(dirname $DIR)
fi

node $WORKSPACE_LK/bin/send-to-lively.js $@
