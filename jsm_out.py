#!/usr/bin/env python3.2

import os, re, subprocess, sys

from jsm_const import *
from jsm_util  import *

def jsm_out_prepare( in_filename, default_in = DEFAULT_IN, default_out = DEFAULT_OUT ):

    in_filename = fix_in_filename( in_filename, default_in )
    is_jsm = in_filename.endswith( JSM_EXT )
    
    out_filename = get_out_filename( in_filename, default_in, default_out )
    if is_jsm:
        out_filename = os.path.splitext( out_filename )[ 0 ] + JS_EXT
    
    if not is_jsm:
        return JS_NO_CHANGE_PREPARE_ONE( in_filename, out_filename )
    else:
        return JSM2JS_AND_INLINE_PREPARE_ONE( in_filename, out_filename )



def jsm_out( piece ):

    mo = JS_OUT_PIECE_RX.match( piece )

    in_filename  = mo.group( 'in_filename' )
    out_filename = mo.group( 'out_filename' )
    outcode      = mo.group( 'outcode' )

    assert in_filename

    simple_copy = not outcode.strip()
    if simple_copy:
        outcode = open( in_filename, 'rb' ).read().decode( UTF8 )

    #
    
    print( 'jsm_out: {0} {1} \t-> {2}'.format(  '(copy)  ' if simple_copy else '(jsm2js)', in_filename, out_filename ) )

    outbytes = outcode.encode( UTF8 )
    open( ensure_dir_for_filename( out_filename ), 'wb' ).write( outbytes )

    jsm_out_test( in_filename, out_filename )
    

def jsm_out_test( in_filename, out_filename ):

    # Optionally there can be a test file

    intestfilename = os.path.splitext( in_filename )[ 0 ] + TEST_JS_EXT
    if os.path.exists( intestfilename ):

        outtestfilename = os.path.splitext( out_filename )[ 0 ] + TEST_JS_EXT
        print( 'jsm_out: (test,copy,test) {0} \t-> {1}'.format( intestfilename, outtestfilename ) )



        # Run the test on the input file
        in_test_result = run_test_js( in_filename, intestfilename, dev = True )

        

        # Copy it exactly
        new_test_code   = open( intestfilename, 'rb' ).read().decode( UTF8 )
        
        open( ensure_dir_for_filename( outtestfilename ), 'wb' ).write( new_test_code.encode( UTF8 ) )


        # Run the test on the output file
        out_test_result = run_test_js( out_filename, outtestfilename )
        


# can also run standalone, e.g. to check the jsm2js transformation on
# a particular .jsm file

if __name__ == '__main__':
    jsm_out( sys.argv[ 1 ] )
    
