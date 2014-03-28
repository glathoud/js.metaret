#!/usr/bin/env python3

import os, pprint, re, subprocess, sys

from jsm_const import *
from jsm_util  import *
from jsm_out_build import walk_test

def jsm_out_mini( infilename, deptree = None, default_in = DEFAULT_IN, default_out_build = DEFAULT_OUT_BUILD, default_out_mini = DEFAULT_OUT_MINI ):

    infilename       = fix_in_filename( infilename, default_in )
    assert os.path.exists( infilename )
    
    outbuildfilename = get_out_filename( infilename, default_in, default_out_build )
    assert os.path.exists( outbuildfilename )

    outminifilename = get_out_filename( infilename, default_in, default_out_mini )

    print()
    print( outminifilename )

    outcode = subprocess.check_output( [ D8, '-e', MINIFY( outbuildfilename ) ],
                                       stderr=subprocess.STDOUT,
                                       universal_newlines = True
                                       )

    open( ensure_dir_for_filename( outminifilename ), 'wb' ).write( outcode.encode( UTF8 ) )

    # Optionally there can be one or more a test file

    walk_test( infilename, outminifilename, default_in, default_out_mini, stdout_prefix = 'jsm_out_mini' )
        
if __name__ == '__main__':
    jsm_out_mini( sys.argv[ 1 ] )
    
