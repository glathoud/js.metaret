#!/usr/bin/env python3.2

import os, subprocess

from jsm_const import *

def ensure_dir_for_filename( filename ):

    '''Make sure the dir containing `filename` exists,
    creates the dir if necessary,
    then return `filename`.`'''

    dirname = os.path.split( filename )[ 0 ]
    if not os.path.exists( dirname ):
        os.makedirs( dirname )

    assert os.path.isdir( dirname )

    return filename

def fetch_deptree( inname, default_in = DEFAULT_IN, deptree_rx = DEPTREE_RX ):

    filename = inname  if  os.path.exists( inname )  else  os.path.join( 'jsm_dev', inname )

    code = open( filename, 'rb' ).read().decode( 'utf-8' )
    children = []
    ret  = { filename : { CODE : code, CHILDREN : children, IS_JSM : filename.endswith( JSM_EXT ) } }

    for m in deptree_rx.finditer( code ):

        dep = { BEGIN : m.start(), END : m.end(), FILENAME : None }
        children.append( dep )

        kid_filename = m.group( FILENAME )

        if kid_filename in ret:
            continue

        kidtree,tmp = fetch_deptree( kid_filename, default_in = default_in, deptree_rx = deptree_rx )
        assert tmp == kid_filename

        # flat `ret` output
        dep[ FILENAME ]     = kid_filename
        ret[ kid_filename ] = kidtree[ kid_filename ]

    return ret,filename

def fix_in_filename( in_filename, default_dir ):

    if not os.path.exists( in_filename ):
        in_filename = os.path.join( default_dir, in_filename )
    assert os.path.exists( in_filename )

    return in_filename

def get_out_filename( in_filename, default_dir_in, default_dir_out ):

    out_filename = in_filename.replace( default_dir_in, default_dir_out )
    if out_filename == in_filename:
        out_filename = os.path.join( default_dir_out, out_filename )

    return out_filename

def replace_dependencies( deptree, in_filename, default_in, default_out, deptree_rx = DEPTREE_RX ):
    '''Recursive replacement of dependencies, can be used to produce a
    single build file, as in ./jsm_out_build.py'''
    
    in_filename  = fix_in_filename( in_filename, default_in )
    out_filename = get_out_filename( in_filename, default_in, default_out )

    assert os.path.exists(  in_filename )
    assert os.path.exists( out_filename )
    
    outcode = open( out_filename, 'rb' ).read().decode( UTF8 )

    depli = deptree[ in_filename ][ CHILDREN ]
    i_dep = 0
    todo_li = []
    DEP ='dep'

    for m in deptree_rx.finditer( outcode ):

        dep = depli[ i_dep ]
        i_dep += 1

        # Both in and out files must have the same list of `need$()`.
        #
        # A simple and safe way to guarantee this is to write the list
        # of `need$()` at the top of your .js or .jsm file.
        assert dep[ FILENAME ] == m.group( 'filename' )  

        todo_li.append( { BEGIN : m.start(), END : m.end(), DEP : dep } )

    # Now we have everything we need to eliminate `need$()` calls.

    todo_li.reverse()    # Last first

    for todo in todo_li:
        begin = todo[ BEGIN ]
        end   = todo[ END ]
        dep   = todo[ DEP ]

        one_in_filename = dep[ FILENAME ]

        if not one_in_filename:
            one_out_code = ''  # already has the dependency
        else:
            one_out_filename = re.sub( r'\.jsm$', '.js', get_out_filename( one_in_filename, default_in, default_out ) )
            one_out_code     = open( one_out_filename, 'rb' ).read().decode( UTF8 )

        outcode = (
            outcode[ :begin ] +
            ((os.linesep + '//#BUILD_BEGIN_FILE: "' + one_in_filename + '"' + (2 * os.linesep) ) if one_out_code else '') +
            one_out_code +
            ((os.linesep + '//#BUILD_END_FILE: "' + one_in_filename + '"' + (2 * os.linesep) ) if one_out_code else '') +
            outcode[ end: ]
        )

    return outcode

def run_test_js( filename, testfilename, all_tests_passed_str=ALL_TESTS_PASSED, verbose=True ):

    if verbose:
        print('Testing "{0}" against test "{1}"... '.format( filename, testfilename ), end='')

    ret = subprocess.check_output( [ D8, '-e', RUN_TEST_JS( filename, testfilename, all_tests_passed_str ) ],
                                   stderr=subprocess.STDOUT,
                                   universal_newlines = True
                                ).strip()

    success = ret == all_tests_passed_str

    if not success:
        print()
        print(ret)
        print('!=')
        print(all_tests_passed_str)
        
    assert success

    if verbose:
        print(all_tests_passed_str)
    
