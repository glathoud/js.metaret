import re

ALL_TESTS_PASSED = 'All_tests_passed'

BEGIN = 'begin'

CHILDREN = 'children'
CODE = 'code'

D8 = 'd8'

DEFAULT_IN = 'jsm_dev'
DEPTREE_RX = re.compile( r'need\$\s*\(\s*(?P<quote>["\'])(?P<filename>[^"\']+)(?P=quote)\s*\)'  )

DEFAULT_OUT = 'jsm_out'
DEFAULT_OUT_BUILD = 'jsm_out_build'
DEFAULT_OUT_MINI  = 'jsm_out_mini'

END = 'end'

FILENAME = 'filename'


IS_JSM = 'isJsm'

JSM2JS = lambda filename: 'load("jsm2js.js"); print(jsm2js(read("' + filename + '")))'
JSM2JS_AND_INLINE = lambda filename: 'load("jsm2js.js"); load("inline.js"); print(inline(jsm2js(read("' + filename + '"))))'

JSM_EXT = '.jsm'

MINIFY = lambda filename: 'load("minify.js"); print(minify(read("' + filename + '")))'

RUN_TEST_JS = lambda filename, testfilename, all_tests_passed_str = ALL_TESTS_PASSED: ' '.join(
    ( 'load("need$.js");',
      'need$("' + filename + '");',
      'need$("' + testfilename + '");',
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
