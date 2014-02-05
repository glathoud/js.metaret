#!/usr/bin/env python3.2

import os, re, subprocess, sys

from jsm_const import *
from jsm_util  import *

def jsm_out( in_filename, default_in = DEFAULT_IN, default_out = DEFAULT_OUT, incode = None ):

    in_filename = fix_in_filename( in_filename, default_in )

    out_filename = get_out_filename( in_filename, default_in, default_out )

    is_jsm = out_filename.endswith( JSM_EXT )

    if not is_jsm:
        outcode = incode
    else:
        out_filename = os.path.splitext( out_filename )[ 0 ] + '.js'
        outcode = subprocess.check_output( [ D8, '-e', JSM2JS_AND_INLINE( in_filename ) ],
                                           stderr=subprocess.STDOUT,
                                           universal_newlines = True
                                           )
        

        

    print( 'jsm_out: {0} {1} \t-> {2}'.format(  '(copy)  ' if not is_jsm else '(jsm2js)', in_filename, out_filename ) )

    outbytes = outcode.encode( UTF8 )
    open( ensure_dir_for_filename( out_filename ), 'wb' ).write( outbytes )


    # Optionally there can be a test file

    intestfilename = os.path.splitext( in_filename )[ 0 ] + TEST_JS_EXT
    if os.path.exists( intestfilename ):

        outtestfilename = get_out_filename( intestfilename, default_in, default_out )
        print( 'jsm_out: (test,copy,test) {0} \t-> {1}'.format( intestfilename, outtestfilename ) )



        # Run the test on the input file
        in_test_result = run_test_js( in_filename, intestfilename )

        

        # Copy it exactly
        new_test_code   = open( intestfilename, 'rb' ).read().decode( UTF8 )
        
        open( ensure_dir_for_filename( outtestfilename ), 'wb' ).write( new_test_code.encode( UTF8 ) )


        # Run the test on the output file
        out_test_result = run_test_js( out_filename, outtestfilename )
        


# can also run standalone, e.g. to check the jsm2js transformation on
# a particular .jsm file

if __name__ == '__main__':
    jsm_out( sys.argv[ 1 ] )
    
