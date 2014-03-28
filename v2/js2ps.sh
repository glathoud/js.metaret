#!/bin/sh
find . -maxdepth 1 -name '*.js' -exec a2ps --columns=2 -r -C -o {}.ps {} \;
