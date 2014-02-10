#!/usr/bin/env python3.2

import os, re, sys

from jsm_const import *
from jsm_out   import *
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

    codeli = walk_jsm_out( deptree, infilename )

    v8_code = JSM2JS_AND_INLINE_SETUP + ('print("' + JS_SEP_IN + '"); ').join( codeli )

    # We have to do all files at once, because within V8 they share a
    # `js_workspace` because `inline` across files is permitted, see:
    # https://github.com/glathoud/js.metaret/issues/7
    
    outli = subprocess.check_output(

        [ D8, '-e', v8_code ],
        stderr=subprocess.STDOUT,
        universal_newlines = True

        ).split( JS_SEP_OUT )

    for piece in outli:
        jsm_out( piece )  # includes an automatic test, whenever the corresponding .test.js file is present
    
    # Step 3: build -> a single file including all dependencies
    
    jsm_out_build( infilename, deptree = deptree )

    # Step 4 minify

    jsm_out_mini( infilename, deptree = deptree )

    
def walk_jsm_out( deptree, filename, py_workspace=None, codeli= None ):

    if not py_workspace:
        py_workspace = { VISITED : set() }

    if None == codeli:
        codeli = []

    if filename in py_workspace[ VISITED ]:
        return codeli
    
    py_workspace[ VISITED ].add( filename ) 

    #
    
    one = deptree[ filename ]

    # Children first (dependencies)

    kids = (CHILDREN in one) and one[ CHILDREN ]
    if kids:
        for k in kids:
            walk_jsm_out( deptree, k[ FILENAME ], py_workspace, codeli )

    # Then file

    codeli.append( jsm_out_prepare( filename ) )

    return codeli


if __name__ == '__main__':
    main( sys.argv[ 1: ] )
