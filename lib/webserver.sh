#!/usr/bin/env bash

RELATIVE_PATH="$(dirname $0)/../build";
ABSOLUTE_PATH="$(readlink -f -- $RELATIVE_PATH)";

echo "Serving: $ABSOLUTE_PATH";

cd $ABSOLUTE_PATH
python3 -m http.server