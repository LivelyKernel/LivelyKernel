#!/usr/bin/env bash

dir=`dirname $0`

if [ -z "$WORKSPACE_LK" ]; then
    export WORKSPACE_LK=$(dirname $dir)
fi

node $dir/lively-as-editor.js "$@"
