#!/usr/bin/env python3.2

import os, re, subprocess, sys

from jsm_const import *

def jsm_out( in_filename, default_in = DEFAULT_IN, default_out = DEFAULT_OUT, incode = None ):

    if not os.path.exists( in_filename ):
        in_filename = os.path.join( default_in, in_filename )
    assert os.path.exists( in_filename )

    out_filename = in_filename.replace( default_in, default_out )
    if out_filename == in_filename:
        out_filename = os.path.join( default_out, out_filename )

    is_jsm = out_filename.endswith( JSM_EXT )

    if not is_jsm:
        outcode = incode
    else:
        out_filename = os.path.splitext( out_filename )[ 0 ] + '.js'
        outcode = subprocess.check_output( [ D8, '-e', JSM2JS( in_filename ) ],
                                           stderr=subprocess.STDOUT,
                                           universal_newlines = True
                                           )
        

        

    print( 'jsm_out: {0} ->({1})-> {2}'.format(  in_filename, 'copy' if not is_jsm else 'jsm2js', out_filename ) )

    outbytes = outcode.encode( UTF8 )
    open( out_filename, 'wb' ).write( outbytes )

# can also run standalone, e.g. to check the jsm2js transformation on
# a particular .jsm file

if __name__ == '__main__':
    jsm_out( sys.argv[ 1 ] )
    
