# sourced for lively commands

function normalize_path {
  echo `cd "$1"; pwd`;
}

function cd! {
  send-to-lively.sh changeWorkingDirectory `normalize_path "$1"`;
}
