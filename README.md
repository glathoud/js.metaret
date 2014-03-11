js.metaret
==========

lightweight mutual tail recursion optimization without trampoline

also known as: Tail Metacomposition

These are the sources for the article http://glat.info/js.metaret/
and the slides http://glat.info/mlocjs2014/#3

.

Background: Implementing mutual tail recursion optimization without trampoline [1] - for good performance - led me to write quite insane code [2]. Here is a lighter approach, that extends JavaScript with two keywords `metafun` and `metaret`, implementing one tiny bit of Backus' metacomposition [3].

.

Addition: An extra keyword `inline` triggers hygienic inlining, see issue [#3](https://github.com/glathoud/js.metaret/issues/3) and [expl_longer.jsm](jsm_dev/expl_longer.jsm) for examples.

.

[0] http://glat.info

[1] http://glat.info/jscheck/tomrec.xhtml

[2] http://glat.info/jscheck/tool.tailopt.js

[3] http://www.stanford.edu/class/cs242/readings/backus.pdf

## How to use here: to quickly test a small idea

Requirements: a browser. Maybe a server like [simple_server.py](simple_server.py)

Look at [jsm_dev.html](jsm_dev.html) and [jsm_dev/expl.js](jsm_dev/expl.js) and play around with them to start with.
There should be a live example: http://glat.info/js.metaret/jsm_dev.html

## How to use outside

Requirements: [Python 3](http://docs.python.org/3/) and [V8](https://code.google.com/p/v8/).

Include/load the one script [metaret_standalone.js](metaret_standalone.js) to develop and test (similarly to [jsm_dev.html](jsm_dev.html)).

When done with development and testing, the use e.g. `../js.metaret/jsm_build.py
somewhere/else/jsm_dev/yourapp.jsm` to build your app == production
code == 100% JavaScript-compatible (relies mainly on [jsm2js.js](jsm2js.js)).

Note that `jsm_build.py` automatically runs the corresponding `.test.js` file,
see for example [jsm_dev/expl.js](jsm_dev/expl.js) and [jsm_dev/expl.test.js](jsm_dev/expl.test.js)