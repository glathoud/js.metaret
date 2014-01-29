#!/usr/bin/env python3.2

import os, pprint, re, sys

from jsm_const import *
from jsm_util  import *

def jsm_out_build( infilename, deptree = None, default_in = DEFAULT_IN, default_out = DEFAULT_OUT, default_out_build = DEFAULT_OUT_BUILD ):

    infilename       = fix_in_filename( infilename, default_in )
    outfilename      = get_out_filename( infilename, default_in, default_out )
    outbuildfilename = get_out_filename( outfilename, default_out, default_out_build )

    print()
    print(outbuildfilename)
    
    if not deptree:
        deptree = fetch_deptree( infilename )

    new_code = replace_dependencies( deptree, infilename, default_in, default_out )

    open( outbuildfilename, 'wb' ).write( new_code.encode( UTF8 ))


    # Optionally there can be a test file

    intestfilename = os.path.splitext( infilename )[ 0 ] + TEST_JS_EXT
    if os.path.exists( intestfilename ):

        outtestfilename = get_out_filename( intestfilename, default_in, default_out_build )
        print( outtestfilename )

        # Copy it almost exactly, stripping some parts
        new_test_code   = re.sub( TEST_DEV_ONLY_RX, '', open( intestfilename, 'rb' ).read().decode( UTF8 ) )
        
        open( outtestfilename, 'wb' ).write( new_test_code.encode( UTF8 ) )

        
if __name__ == '__main__':
    jsm_out_build( sys.argv[ 1 ] )
    
