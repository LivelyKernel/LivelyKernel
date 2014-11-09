#!/usr/bin/env bash

PASSWORD_QUERY=$1
DIR=${WORKSPACE_LK-"$0/../.."}
node $DIR/bin/askpass.js $PASSWORD_QUERY
