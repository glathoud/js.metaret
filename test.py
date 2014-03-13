#!/usr/bin/env python3

'''This should be the command-line pendant of ./test.html

By Guillaume Lathoud
glathoud@yahoo.fr
'''

import subprocess

from jsm_build import main
from jsm_const import D8


ret = subprocess.check_output( [ D8, '-e', 'load("lightparse_test.js");print(lightparse_test());' ],
                               stderr=subprocess.STDOUT,
                               universal_newlines = True
                               ).strip()
assert ret == 'true', 'lightparse_test failed'
print("--- lightparse_test succeeded ---")

main( [ 'jsm_dev/example_development.jsm' ] )
main( [ 'jsm_dev/expl.js' ] )
main( [ 'jsm_dev/metaret_standalone.js' ] )
