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

## How to use for development

Requirements: [node.js](http://nodejs.org) or [V8](https://code.google.com/p/v8/) or a browser (browser: maybe with a server like [simple_server.py](simple_server.py)).

Include/load the one script [metaret_standalone.js](metaret_standalone.js) to develop and test.

#### Example

 * [example_development.html](example_development.html)
 * [jsm_dev/example_development.jsm](jsm_dev/example_development.jsm)


## How to build and test for production

Requirements: [Python 3](http://docs.python.org/3/) and [V8](https://code.google.com/p/v8/).

When done with development and testing, then use e.g. `../js.metaret/jsm_build.py
somewhere/else/jsm_dev/yourapp.jsm` to build your app == production
code == 100% JavaScript-compatible (relies mainly on [jsm2js.js](jsm2js.js)).

Note that `jsm_build.py` automatically runs the corresponding `.test.js` file,
see for example [jsm_dev/example_development.test.js](jsm_dev/example_development.test.js).

#### Example

 * [example_production.html](example_production.html)
 * [jsm_out_mini/example_development.js](jsm_out_mini/example_development.js)
