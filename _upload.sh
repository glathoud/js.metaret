#!/usr/bin/env bash

index.scm
echo '_upload.sh: uploading "metaret" article...'
find . -name '*~' -exec rm {} \;
echo "mkdir js.metaret
cd js.metaret
mput -rf *.scm *.html *.js *.TXT *.xcf *.jpg
" | ncftp glat
echo '_upload.sh: upload successful!'
