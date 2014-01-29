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
        outcode = subprocess.check_output( [ D8, '-e', JSM2JS( in_filename ) ],
                                           stderr=subprocess.STDOUT,
                                           universal_newlines = True
                                           )
        

        

    print( 'jsm_out: {0} {1} \t-> {2}'.format(  '(copy)  ' if not is_jsm else '(jsm2js)', in_filename, out_filename ) )

    outbytes = outcode.encode( UTF8 )
    open( out_filename, 'wb' ).write( outbytes )

# can also run standalone, e.g. to check the jsm2js transformation on
# a particular .jsm file

if __name__ == '__main__':
    jsm_out( sys.argv[ 1 ] )
    
