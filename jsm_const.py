import re

ALL_TESTS_PASSED = 'All tests passed.'

BEGIN = 'begin'

CHILDREN = 'children'
CODE = 'code'

D8 = 'd8'

DEFAULT_IN = 'jsm_dev'
DEPTREE_RX = re.compile( r'need\$\s*\(\s*(?P<quote>["\'])(?P<filename>[^"\']+)(?P=quote)\s*\);?'  )

DEFAULT_OUT = 'jsm_out'
DEFAULT_OUT_BUILD = 'jsm_out_build'
DEFAULT_OUT_MINI  = 'jsm_out_mini'

END = 'end'

FILENAME = 'filename'


IS_JSM = 'isJsm'

JS_WORKSPACE = 'js_workspace'
JS_SEP_IN  = '\\n##########'
JS_SEP_OUT = '\n##########\n'

JSM2JS_AND_INLINE_SETUP = ' '.join([
    'load("jsm2js.js");',
    'load("inline.js");',
    JS_WORKSPACE + ' = {};',
    '',
    ])

JSM2JS_AND_INLINE_PREPARE_ONE = lambda in_filename,out_filename: ' '.join( [
    'var in_filename = "' + in_filename + '";',
    'var out_filename = "' + out_filename + '";',
    'print( "#in_filename:\'" + in_filename + "\'" );',
    'print( "#out_filename:\'" + out_filename + "\'" );',
    'print( inline( jsm2js( read( in_filename ) ), ' + JS_WORKSPACE + ', in_filename ) );',
    '',
    ])

JS_NO_CHANGE_PREPARE_ONE = lambda in_filename,out_filename: ' '.join( [
    'var in_filename = "' + in_filename + '";',
    'var out_filename = "' + out_filename + '";',
    'print( "#in_filename:\'" + in_filename + "\'" );',
    'print( "#out_filename:\'" + out_filename + "\'" );',
    'print();',
    '',
    ])


JS_OUT_PIECE_RX = re.compile( r'^\s*#in_filename:["\'](?P<in_filename>[^"\']+?)["\']\s*#out_filename:["\'](?P<out_filename>[^"\']+?)["\']\s*(?P<outcode>[\s\S]*)$' )

JS_EXT = '.js'

JSM_EXT = '.jsm'

MINIFY = lambda filename: 'load("minify.js"); print(minify(read("' + filename + '")))'

RUN_TEST_JS = lambda filename, testfilename, dev = False, all_tests_passed_str = ALL_TESTS_PASSED: ' '.join(
    ( ( 'load("need$.js");', 'need$("' + filename + '");', ) if dev  # dev mode: need$ dependencies allowed
      else ( 'load("' + filename + '");', 'load("need$.js");', ) )   # build mode: all need$ dependencies must have been eliminated
+
( 'need$("' + testfilename + '");', # the test file itself can use need$ in both dev and build modes
  'var result;',
      'try {',
      'result = test();',
      '} catch (e) {',
      'result = e;',
      '}',
      'print(result === true  ?  "' + ALL_TESTS_PASSED + '" : result);',
      )
    )

TEST_DEV_ONLY_RX = re.compile( r'//#BEGIN_TEST_DEV_ONLY[\s\S]*//#END_TEST_DEV_ONLY' )
TEST_JS_EXT      = '.test.js'

UTF8 = 'utf-8'

VISITED = 'visited'
