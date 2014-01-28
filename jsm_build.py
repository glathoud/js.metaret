#!/usr/bin/env python3.2

import os, re, sys

from jsm_const import *
from jsm_out   import jsm_out


def fetch_deptree( inname, default_in = DEFAULT_IN, deptree_rx = DEPTREE_RX ):

    filename = inname  if  os.path.exists( inname )  else  os.path.join( 'jsm_dev', inname )

    code = open( filename, 'rb' ).read().decode( 'utf-8' )
    children = []
    ret  = { filename : { CODE : code, CHILDREN : children, IS_JSM : filename.endswith( JSM_EXT ) } }

    for m in deptree_rx.finditer( code ):

        kid_filename = m.group( FILENAME )

        if kid_filename in ret:
            continue

        print(kid_filename)
        
        kidtree = fetch_deptree( kid_filename, default_in = default_in, deptree_rx = deptree_rx )
        
        # flat `ret` output
        children.append( kid_filename )
        ret[ kid_filename ] = kidtree[ kid_filename ]

    return ret

    

def main( argv_1 ):

    inname  = argv_1[ 0 ]
    
    deptree = fetch_deptree( inname )

    for filename in deptree:
        jsm_out( filename, incode = deptree[ filename ][ CODE ] )
    
    pass


if __name__ == '__main__':
    main( sys.argv[ 1: ] )


