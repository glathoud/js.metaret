import re

CHILDREN = 'children'
CODE = 'code'

D8 = 'd8'

DEFAULT_IN = 'jsm_dev'
DEPTREE_RX = re.compile( r'need\$\s*\(\s*(?P<quote>["\'])(?P<filename>[^"\']+)(?P=quote)\s*\)'  )

DEFAULT_OUT = 'jsm_out'

FILENAME = 'filename'


IS_JSM = 'isJsm'

JSM2JS = lambda filename: 'load("jsm2js.js"); print(jsm2js(read("' + filename + '")))'

JSM_EXT = '.jsm'

UTF8 = 'utf-8'
