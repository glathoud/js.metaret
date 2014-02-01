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
