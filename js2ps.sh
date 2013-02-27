#!/bin/sh
find . -name '*.js' -exec a2ps --columns=2 -r -C -o {}.ps {} \;

