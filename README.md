js.metaret
==========

lightweight mutual tail recursion optimization without trampoline

also known as: Tail Metacomposition

These are the sources for the article http://glat.info/js.metaret/
and the slides http://glat.info/mlocjs2014/#3

.

Background: Implementing mutual tail recursion optimization without trampoline [1] - for good performance - led me to write quite insane code [2]. Here is a lighter approach, that extends JavaScript with two keywords `metafun` and `metaret`, implementing one tiny bit of Backus' metacomposition [3].

.

`metafun` and `metaret` are useful to write fast functional code.

In addition, an extra
keyword `inline` triggers hygienic inlining, see issue
[#3](https://github.com/glathoud/js.metaret/issues/3) and
[expl_longer.jsm](jsm_dev/expl_longer.jsm) for examples. `inline` can be useful to
speedup imperative code.

.

[0] http://glat.info

[1] http://glat.info/jscheck/tomrec.xhtml

[2] http://glat.info/jscheck/tool.tailopt.js

[3] http://www.stanford.edu/class/cs242/readings/backus.pdf

## Convention

 * `.jsm` files may use the extra keywords `metafun`, `metaret` and `inline`.
 * `.js` files contain 100% standard JavaScript.

## Getting started: develop your app

#### Requirements: 
 * A browser, or [node.js](http://nodejs.org) or [V8](https://code.google.com/p/v8/). (browser: maybe with a server like [simple_server.py](simple_server.py).)
 * [metaret_standalone.js](metaret_standalone.js)

#### Example:
 * [jsm_dev/example_development.jsm](jsm_dev/example_development.jsm)
 * [jsm_dev/example_development.test.js](jsm_dev/example_development.test.js) (automatically tested during build, as described below).
 * Check it in a browser: [example_development.html](example_development.html)

## Getting started: test and build your app

#### Requirements: 
 * [Python 3](http://docs.python.org/3/)
 * [V8](https://code.google.com/p/v8/)
 * [./jsm_build.py](jsm_build.py)

`jsm_build.py` (1) transforms all `.jsm` files back to 100%-standard
JavaScript `.js` files, (2) automatically runs the corresponding
`.test.js` files and (2) collate them into a single, minified `.js`
file.

#### Example:
```
jsm_build.py jsm_dev/example_development.jsm
```
 * Output: ./jsm_out_mini/example_development.js
 * Check it in a browser: [example_production.html](example_production.html)

## Longer example

 * [jsm_dev/expl.js](jsm_dev/expl.js) and [jsm_dev/expl.test.js](jsm_dev/expl.test.js)
 * [jsm_dev/expl_basic.jsm](jsm_dev/expl_basic.jsm) and [jsm_dev/expl_basic.test.js](jsm_dev/expl_basic.test.js)
 * [jsm_dev/expl_longer.jsm](jsm_dev/expl_longer.jsm) and [jsm_dev/expl_longer.test.js](jsm_dev/expl_longer.test.js)

Assuming that you have installed [Python 3](http://docs.python.org/3/)
and [V8](https://code.google.com/p/v8/), you can build this example
into one minified file: 

``` 
jsm_build.py jsm_dev/expl.js
```

This takes the original `jsm_dev/expl*.js[m]` files and produces:
 * as many 100% JS-compatible files: `jsm_out/expl*.js`
    * ...and tests them against the corresponding `.test.js` files.
 * one build file: `jsm_out_build/expl.js`
    * ...and tests them against the corresponding `.test.js` files.
 * one minified file: `jsm_out_mini/expl.js`
    * ...and tests them against the corresponding `.test.js` files.

A test file `.test.js` declares one `function test () { ... }` which `return`s `true` if success. Any other behaviour is seen as a failure:
 * `test()` throws an eror,
 * or `test()` returns something else than `true`.

## Fun fact

[metaret_standalone.js](metaret_standalone.js) was produced by building the one-liner [jsm_dev/metaret_standalone.js](jsm_dev/metaret_standalone.js):
```
need$( 'need$.js' );
```

For more details: [./build_standalone.sh](build_standalone.sh)
