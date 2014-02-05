#!/usr/bin/env python3.2

import os, pprint, re, subprocess, sys

from jsm_const import *
from jsm_util  import *

def jsm_out_mini( infilename, default_in = DEFAULT_IN, default_out_build = DEFAULT_OUT_BUILD, default_out_mini = DEFAULT_OUT_MINI ):

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

    # Optionally there can be a test file, copy it as is

    outbuild_test_filename = os.path.splitext( outbuildfilename )[ 0 ] + TEST_JS_EXT
    if os.path.exists( outbuild_test_filename ):

        outmini_test_filename = get_out_filename( outbuild_test_filename, default_out_build, default_out_mini,  )
        print( 'jsm_out_mini: (copy,test) {0} \t-> {1}'.format( outbuild_test_filename, outmini_test_filename ) )

        open( ensure_dir_for_filename( outmini_test_filename ), 'wb' ).write( open( outbuild_test_filename, 'rb' ).read() )


        # Test it
        out_test_result = run_test_js( outminifilename, outmini_test_filename )

        
if __name__ == '__main__':
    jsm_out_mini( sys.argv[ 1 ] )
    
