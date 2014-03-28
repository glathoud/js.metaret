#!/usr/bin/env sh 

set -v

# ---------- CLEANING ----------

rm metaret_standalone.js 2>>/dev/null
rm jsm_out_mini/metaret_standalone.js 2>>/dev/null

# ---------- BUILDING ----------

./jsm_build.py jsm_dev/metaret_standalone.js

# ---------- COPYING ----------

cp jsm_out_mini/metaret_standalone.js .

# ---------- DONE! ----------

