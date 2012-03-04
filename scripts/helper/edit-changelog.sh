#!/usr/bin/env bash --login

####################################
# reading new entry for change log #
# using in link-core script        #
####################################

if [[ -z $EDITOR ]]; then
    EDITOR=vi
fi

function edit {
    eval "$EDITOR $1;"
    wait ${!}
    cat $1
    echo -en  "\n\nChanges OK? y/n "
    read ans
    case ${ans} in
        n*) edit $1;;
    esac
}

edit $1;
