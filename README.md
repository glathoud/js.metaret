## Goal

Write less code, that reads clear and runs
fast [Budapest 2014 [slides](http://glat.info/mlocjs2014/index.html), [video](http://www.ustream.tv/recorded/43778953), [both](http://www.infoq.com/presentations/javascript-tail-call-map-reduce)].

## Contents

 * [How?](#how)
 * [Node.js support](#nodejs-support)
 * [Getting started: develop your app](#getting-started-develop-your-app)
 * [Getting started: test and build your app](#getting-started-test-and-build-your-app)
 * [Bigger example](#bigger-example)
 * [Background](#background)
 * [Fun fact](#fun-fact)
 * [Core tests](#core-tests)

## How?

Extend JavaScript with three new keyworkds: `metafun`, `metaret` and
`inline` to write code that is short, expressive AND runs fast.

The extended JavaScript is automatically transformed back
into fast, 100% standard JavaScript.

#### Fast functional calls: Tail metacomposition

For tail calls ([quick definition](http://glat.info/mlocjs2014/#4)), `metafun` and `metaret` can replace `function` and `return`. 

This eliminates the call stack, which speeds up the code dramatically. Mutual tail recursion is supported. 

#### Fast imperative calls: Inlining

`inline` speeds up imperative calls by
eliminating function call overhead.


#### Convention

 * `.jsm` files may use the extra keywords `metafun`, `metaret` and `inline`.
 * `.js` files contain 100% standard JavaScript.


#### Functional example


[./jsm2js.js](jsm2js.js) transforms this clear, expressive code:
```js
metafun gcd(self, a, b) {

  if (a > b)
    metaret self, a-b, b;

  if (b > a)
    metaret self, b-a, a;

  return a;
}
```
into 100% standard JavaScript code that runs fast (no function call):

```js
function gcd(a, b) {
  _L_gcd_: while (true) {

    if (a > b) {
      var _a1_ = a - b;
      a = _a1_;
      continue _L_gcd_;
    }   
   
    if (b > a) {
      var _a_ = b - a;
      var _b_ = a;
      a = _a_;
      b = _b_;
      continue _L_gcd_;
    }
   
    return a;
  }
}
```

#### Imperative example

[./inline_code.js](inline_code.js) transforms this clear, expressive code:

```js
function doSomething() { alert("done!"); }

inline doSomething();
```
into (pretty ugly) 100% standard JavaScript code that runs fast (function call eliminated):
```js
function doSomething(){alert('done');} 
  {
//#INLINE_BEGIN: inline doSomething()
var _undef_,_ret_;
//#INLINE_SET_INPUT_ARGS:
//#INLINE_IMPLEMENT:
do {
{alert('done');}
} while (false);
//#INLINE_END: inline doSomething()
};
```

Three variants are permitted:
```js
inline doSomething();
inline x = getSomething();
inline var x = getSomething();
```

## Node.js support

Thanks to Iain Ballard, there is a Node.js [npm package](https://www.npmjs.org/package/metaret) (GitHub [source](https://github.com/i-e-b/metaret-npm)).

Alternatively, you can develop using just a browser, or the V8 engine alone. See "Getting started".

## Getting started: develop your app

#### Requirements: 
 * A browser,  or [V8](https://code.google.com/p/v8/) (browser: maybe with a server like [./simple_server.py](simple_server.py).)
 * [./metaret_standalone.js](metaret_standalone.js)

#### Example
 * [./jsm_dev/example_development.jsm](jsm_dev/example_development.jsm)
 * [./jsm_dev/example_development.test.js](jsm_dev/example_development.test.js) (automatically tested during build, as described below).
 * Check it in a browser: [./example_development.html](example_development.html) and [live](http://glat.info/js.metaret/example_development.html).

## Getting started: test and build your app

#### Requirements: 
 * [Python 3](http://docs.python.org/3/)
 * [V8](https://code.google.com/p/v8/)
 * [./jsm_build.py](jsm_build.py)

`jsm_build.py` (1) transforms all `.jsm` files back to 100%-standard
JavaScript `.js` files, (2) automatically runs the corresponding
`.test.js` files and (3) collate them into a single, minified `.js`
file.

#### Example
```js
jsm_build.py jsm_dev/example_development.jsm
```
 * Output: ./jsm_out_mini/example_development.js
 * Check it in a browser: [./example_production.html](example_production.html) and [live](http://glat.info/js.metaret/example_production.html).

## Bigger example

Under ./jsm_dev/:
 * [expl_basic.jsm](jsm_dev/expl_basic.jsm) and [expl_basic.test.js](jsm_dev/expl_basic.test.js)
 * [expl_longer.jsm](jsm_dev/expl_longer.jsm) and [expl_longer.test.js](jsm_dev/expl_longer.test.js)
 * [expl.js](jsm_dev/expl.js) and [expl.test.js](jsm_dev/expl.test.js)

Assuming that you have installed [Python 3](http://docs.python.org/3/)
and [V8](https://code.google.com/p/v8/), you can build this example
into one minified file: 

```js
jsm_build.py jsm_dev/expl.js
```

This takes the original `jsm_dev/expl*.js[m]` files and produces:
 * as many 100% JS-compatible files: `jsm_out/expl*.js`
    * ...and tests them against the corresponding `.test.js` files.
 * one build file: `jsm_out_build/expl.js`
    * ...and tests it against the corresponding `.test.js` files.
 * one minified file: `jsm_out_mini/expl.js`
    * ...and tests it against the corresponding `.test.js` files.

A test file `.test.js` declares one `function test () { ... }` which `return`s `true` if success. Any other behaviour is seen as a failure:
 * `test()` throws an eror,
 * or `test()` returns something else than `true`.

## Background

If you do not know what a tail call is, you can have a look at [this
slide](http://glat.info/mlocjs2014/#4).

Earlier I implemented "mutual tail recursion optimization without
trampoline" [[1]](http://glat.info/jscheck/tomrec.xhtml) for good performance, which transforms the clear,
expressive but slow code (many function calls):

```js
function gcd_rec(a, b) {

  if (a > b)
    return gcd_rec(a-b, b);

  if (b > a)
    return gcd_rec(b-a, a);

  return a;
}
```

into a very fast while loop (no call stack):
```js
function gcd_loop(a, b) {
  while (a != b) {
    if (a > b) {
      a = a-b;
    }
    else if (b > a) {
      var c = a;
      a = b-a;
      b = c;
    }
  }
  return a;
}
```

But implementing this automatic transformation led me to write quite
insane code [[2]](http://glat.info/jscheck/tool.tailopt.js).

Moreover, since the automatic transformation worked on 100% normal
JavaScript, the difference remained *implicit* between tail calls
(optimized): 

```js
// tail call: return + single function call
return gcd_rec(a-b, b);
```
and the other function calls (not
optimized):
```js
// not a tail call: no return statement
t.children.forEach(doSomething);

// not a single function call
return sumtree(t.left) + sumtree(t.right);
```

You cannot expect you whole team to know about this *implicit*
difference, which makes it somewhat [unfit to develop large-scale
applications](http://glat.info/mlocjs2014/#7).

Instead, here we make the difference
[*explicit*](http://glat.info/mlocjs2014/#8) using `metafun` and
`metaret` instead of `function` and `return`:
```js
// WITH function calls (call stack)
...
var v = f(x);
...
return f(x); 
...
return f(x)+g(x);
...
o.doSomething();
...

// WITHOUT function calls (no call stack)
metafun gcd(self, a, b) { // metafunction: contains metaret

  if (a > b)
    metaret self, a-b, b; // NOT a call, rather a sanitized goto

  if (b > a) {
    metaret self, b-a, a; // NOT a call, rather a sanitized goto

  return a;
}
```

`metaret` simply change the parameter values and jumps to the
beginning of the metafunction. This runs fast (no call stack),
implements one tiny bit of Backus' metacomposition [[3]](http://glat.info/jscheck/tool.tailopt.js), and can be
seen as a *sanitized sort of goto*:

 * you cannot just put a label anywhere and jump to it (spaghetti code).

 * `metaret` can only jump to the beginning of a metafunction.

 * therefore, you still have to think in term of clean encapsulations using `metafun` and `metaret`,
just as you would using `function` and `return`.

#### Addition

`metaret` only permits a tail call, which excludes an imperative call (calling without returning).

Thus, an extra keyword `inline` was also added that triggers hygienic
inlining, see issue
[#3](https://github.com/glathoud/js.metaret/issues/3) and
[expl_longer.jsm](jsm_dev/expl_longer.jsm) for examples.

`inline` can be useful to speedup imperative code. Three variants are permitted:
```js
inline doSomething();
inline x = getSomething();
inline var x = getSomething();
```



## Fun fact

[./metaret_standalone.js](metaret_standalone.js) was produced by building the one-liner [./jsm_dev/metaret_standalone.js](jsm_dev/metaret_standalone.js):
```js
need$( 'need$.js' );
```

For more details: [./build_standalone.sh](build_standalone.sh)

## Core tests

The command-line [./test.py](test.py) and its browser pendant
[./test.html](test.html) ([live](http://glat.info/js.metaret/test.html)).