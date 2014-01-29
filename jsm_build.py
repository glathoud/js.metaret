#!/usr/bin/env python3.2

import os, re, sys

from jsm_const import *
from jsm_out   import jsm_out
from jsm_out_build import jsm_out_build
from jsm_out_mini  import jsm_out_mini
from jsm_util  import *
   

def main( argv_1 ):

    inname  = argv_1[ 0 ]

    # Step 1: fetch the dependency tree

    print()
    print('jsm_build.py: fetch_deptree for "{0}"'.format( inname ))
    deptree,infilename = fetch_deptree( inname )

    # Step 2: jsm2js for each file -> many files

    print()
    for filename in deptree:
        jsm_out( filename, incode = deptree[ filename ][ CODE ] )

    # Step 3: build -> a single file including all dependencies
    
    jsm_out_build( infilename, deptree = deptree )

    # Step 4 minify

    jsm_out_mini( infilename )
    
if __name__ == '__main__':
    main( sys.argv[ 1: ] )


