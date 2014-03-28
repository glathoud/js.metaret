#!/usr/bin/env bash

index.scm
echo '_upload.sh: uploading "metaret" article...'
find . -name '*~' -exec rm {} \;
echo "mkdir js.metaret
cd js.metaret
mput -rf *.scm *.html *.js *.TXT *.xcf *.jpg jsm_dev jsm_out jsm_out_build jsm_out_mini
" | ncftp glat
echo '_upload.sh: upload successful!'
