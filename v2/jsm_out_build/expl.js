
//#BUILD_BEGIN_FILE: "jsm_dev/expl_basic.jsm"


{
/* 

type="js-metaret-decl": meta-function declarations, using JavaScript
augmented with two extra keywords `metafun` and `metaret`.

`metaret` is a sort of sanitized `goto`:

`metaret` is NOT a function call, hence the absence of brackets.

`metaret` rather means metacomposition, here implemented by inlining
code in an hygienic manner (renaming variables to avoid collisions).

Inlining also reduces the number of function calls to a bare minimum,
which improves runtime performance in many cases.

Sources: <a href="metaret.js">metaret.js</a>  and  <a href="lightparse.js">lightparse.js</a> - MIT <a href="LICENSE.TXT">license</a>

Tests: The present page, and <a href="lightparse_test.html">lightparse_test.html</a>

*/


function fact(k,acc)
{
    var _undef_;
    _L_fact_: while (true) {

        // --- metafun fact
        // --- ( self,k,acc)

        {
            acc  ||  (acc = 1);
            if (k > 1)
                {
         // anonymous self-recursion

        var _k_ = k - 1;
        var _acc_ = acc * k;
        k = _k_;
        acc = _acc_;
        continue _L_fact_;
        }
            else
                return acc;
        }
          return;
    }

}



function gcd(a,b)
{
    var _undef_;
    _L_gcd_: while (true) {

        // --- metafun gcd
        // --- ( self,a,b)

        {
            if (a > b)
                {
        var _a1_ = a-b;
        a = _a1_;
        continue _L_gcd_;
        }

            if (b > a)
                {
        var _a_ = b-a;
        var _b_ = a;
        a = _a_;
        b = _b_;
        continue _L_gcd_;
        }

            return a; 
        }
          return;
    }

}


// Variant: define and solve *metafunctions* within a local namespace, 
// then export the resulting *functions* using for example:
//
// `global.isEven = isEven`.
//
// See also: ../jsm2js.js

(function (global) {

    // --- API: global functions

    global.isEven = isEven;
    global.isOdd  = isOdd;

    // --- API implementation: local metafunctions
    
    
function isEven(n)
{
    var _undef_;
    var _switch_ind_ = 0;
    _L_switch_: while (true) {
        switch (_switch_ind_) {

            case 0:

                // --- metafun anonymous#0.isEven
                // --- ( self,n)

                {
                        if (n > 0)
                            {
                 // mutual recursion

                n = n - 1;
                _switch_ind_ = 1; // --- go to: isOdd
                continue _L_switch_;
                }
                        if (n < 0)
                            {
                n = -n;
                continue _L_switch_; // --- stay in: anonymous#0.isEven
                }

                        return true;
                    }
            break;

            case 1:

                // --- metafun anonymous#0.isOdd
                // --- ( self,n)

                {
                        if (n > 0)
                            {
                n = n - 1;
                _switch_ind_ = 0; // --- go to: isEven
                continue _L_switch_;
                }

                        if (n < 0)
                            {
                n = -n;
                continue _L_switch_; // --- stay in: anonymous#0.isOdd
                }

                        return false; 
                    }
            break;

        }
        return;
    }

}


    
function isOdd(n)
{
    var _undef_;
    var _switch_ind_ = 0;
    _L_switch_: while (true) {
        switch (_switch_ind_) {

            case 0:

                // --- metafun anonymous#0.isOdd
                // --- ( self,n)

                {
                        if (n > 0)
                            {
                n = n - 1;
                _switch_ind_ = 1; // --- go to: isEven
                continue _L_switch_;
                }

                        if (n < 0)
                            {
                n = -n;
                continue _L_switch_; // --- stay in: anonymous#0.isOdd
                }

                        return false; 
                    }
            break;

            case 1:

                // --- metafun anonymous#0.isEven
                // --- ( self,n)

                {
                        if (n > 0)
                            {
                 // mutual recursion

                n = n - 1;
                _switch_ind_ = 0; // --- go to: isOdd
                continue _L_switch_;
                }
                        if (n < 0)
                            {
                n = -n;
                continue _L_switch_; // --- stay in: anonymous#0.isEven
                }

                        return true;
                    }
            break;

        }
        return;
    }

}


    // --- Private stuff
    
    // Here you could have small tool functions and metafunctions
    // which won't be visible globally.
    
})(this);


}

//#BUILD_END_FILE: "jsm_dev/expl_basic.jsm"



//#BUILD_BEGIN_FILE: "jsm_dev/expl_longer.jsm"


{
function sortedSearch(sortedArray,x,less,equal)
{
    var _undef_;
    var _switch_ind_ = 0;
    _L_switch_: while (true) {
        switch (_switch_ind_) {

            case 0:

                // --- metafun sortedSearch
                // --- ( self,sortedArray,x,less,equal)

                {
                    // In a sorted array, search for first and last occurences of `x`.
                    //
                    // If `x` found, return `[ first_index, last_index ]`
                    // (integers).
                    //
                    // If `x` not found, return `null`.

                    less  ||  (less = function (a,b) { return a < b; });
                    equal ||  (equal = function (a,b) { return a == b; });

                    var first_found = false
                    ,    last_found = false
                    ,             i = 0
                    ,             j = sortedArray.length - 1
                    ,          imax = j
                    ,          jmin = i
                    ;

                    {
                _switch_ind_ = 1; // --- go to: improveFirst
                continue _L_switch_;
                }

                }
            break;

            case 1:

                // --- metafun sortedSearch.improveFirst
                // --- ( self)

                {
                        if (!first_found)
                            {
//#INLINE_BEGIN: inline first_found = isFirstFound(sortedArray, i, equal, x)
var _undef_1, _ret_;
//#INLINE_SET_INPUT_ARGS:
var _sortedArray_ = sortedArray;
var _i_ =  i;
var _equal_ =  equal;
var _x_ =  x;
//#INLINE_IMPLEMENT:
do {
{
            _ret_ =  _equal_(_x_, _sortedArray_[_i_])  &&
                (_i_ < 1  ||  !_equal_(_x_, _sortedArray_[_i_ - 1])); break;
        }
} while (false);
first_found = _ret_;
//#INLINE_END: inline first_found = isFirstFound(sortedArray, i, equal, x)
};

                        // Termination tests

                        if (i > j)
                            return null;    // Done: `x` not found.

                        if (first_found && last_found)
                            return [i, j];  // Done: `x` found.

                        // Update

                        if (!first_found)
                        {
                            i++;

                            imax = Math.min( imax, j );

                            var ind = i + ((imax - i) >> 1)
                            , v_ind = sortedArray[ind]
                            ;

                            if (less(v_ind, x) ||
                                isFirstFound(sortedArray, ind, equal, x)
                               )
                                i = ind;
                            else
                                imax = ind;
                        }

                        {
                _switch_ind_ = 2; // --- go to: improveLast
                continue _L_switch_;
                }

                    }
            break;

            case 2:

                // --- metafun sortedSearch.improveLast
                // --- ( self)

                {
                        if (!last_found)
                            {
//#INLINE_BEGIN: inline last_found = isLastFound(sortedArray, j, equal, x)
var _undef_1, _ret_;
//#INLINE_SET_INPUT_ARGS:
var _sortedArray_ = sortedArray;
var _j_ =  j;
var _equal_ =  equal;
var _x_ =  x;
//#INLINE_IMPLEMENT:
do {
{
            _ret_ =  _equal_(_x_, _sortedArray_[_j_])  &&
                (_j_ > _sortedArray_.length - 2  || !_equal_(_x_, _sortedArray_[_j_ + 1])); break;
        }
} while (false);
last_found = _ret_;
//#INLINE_END: inline last_found = isLastFound(sortedArray, j, equal, x)
};

                        // Termination tests already done in `improveFirst`, 
                        // not needed here.

                        // Update

                        if (!last_found)
                        {
                            j--;

                            jmin = Math.max( jmin, i );

                            var ind = j - ((j - jmin) >> 1)
                            , v_ind = sortedArray[ind]
                            ;

                            if (less(x, v_ind) ||
                                isLastFound(sortedArray, ind, equal, x)
                               )
                                j = ind;
                            else
                                jmin = ind;
                        }

                        {
                _switch_ind_ = 1; // --- go to: improveFirst
                continue _L_switch_;
                }

                    }
            break;

        }
        return;
    }

    function isFirstFound(sortedArray,i,equal,x)
    {
            return equal(x, sortedArray[i])  &&
                (i < 1  ||  !equal(x, sortedArray[i - 1]));
        }

    function isLastFound(sortedArray,j,equal,x)
    {
            return equal(x, sortedArray[j])  &&
                (j > sortedArray.length - 2  || !equal(x, sortedArray[j + 1]));
        }
}



}

//#BUILD_END_FILE: "jsm_dev/expl_longer.jsm"



//#BUILD_BEGIN_FILE: "jsm_dev/expl_inline_use.jsm"


{

//#BUILD_BEGIN_FILE: "jsm_dev/expl_inline.jsm"


{
function to_be_inlined(opt1,opt2)
{
    'not doing much, just testing :)';
    opt1 = 1 + (opt1 || 0) + (opt2 || 0);
    if (('undefined' !== typeof console)  &&  console.log)
        console.log('to_be_inlined: opt1 result:', opt1);

    // https://github.com/glathoud/js.metaret/issues/7

    // To test the detection of infinite `inline` recursion
    // uncomment the following line. An error should be thrown.
    // inline to_be_inlined_imbricated();

    return opt1;

    this.line.will.never.be.reached();
}


function to_be_inlined_imbricated(some,optional,parameters)
{
    'still testing :)';
    // https://github.com/glathoud/js.metaret/issues/6

    var arr = [];

    for (var i = 0; i < 3; i++)
    {   
        {
//#INLINE_BEGIN: inline var a = to_be_inlined()
var _undef_, _ret_;
//#INLINE_SET_INPUT_ARGS:
var _opt1_ = _undef_;
var _opt2_ = _undef_;
//#INLINE_IMPLEMENT:
do {
{
    'not doing much, just testing :)';
    _opt1_ = 1 + (_opt1_ || 0) + (_opt2_ || 0);
    if (('undefined' !== typeof console)  &&  console.log)
        console.log('to_be_inlined: opt1 result:', _opt1_);

    // https://github.com/glathoud/js.metaret/issues/7

    // To test the detection of infinite `inline` recursion
    // uncomment the following line. An error should be thrown.
    // inline to_be_inlined_imbricated();

    _ret_ =  _opt1_; break;

    this.line.will.never.be.reached();
}
} while (false);
var a = _ret_;
//#INLINE_END: inline var a = to_be_inlined()
};     
        arr.push( a );
    }

    return arr;
}


}

//#BUILD_END_FILE: "jsm_dev/expl_inline.jsm"



// Simple test of inlining across files.
// https://github.com/glathoud/js.metaret/issues/7

{
//#INLINE_BEGIN: inline to_be_inlined()
var _undef_, _ret_;
//#INLINE_SET_INPUT_ARGS:
var _opt1_ = _undef_;
var _opt2_ = _undef_;
//#INLINE_IMPLEMENT:
do {
{
    'not doing much, just testing :)';
    _opt1_ = 1 + (_opt1_ || 0) + (_opt2_ || 0);
    if (('undefined' !== typeof console)  &&  console.log)
        console.log('to_be_inlined: opt1 result:', _opt1_);

    // https://github.com/glathoud/js.metaret/issues/7

    // To test the detection of infinite `inline` recursion
    // uncomment the following line. An error should be thrown.
    // inline to_be_inlined_imbricated();

    _ret_ =  _opt1_; break;

    this.line.will.never.be.reached();
}
} while (false);
//#INLINE_END: inline to_be_inlined()
};



// Test imbricated inlining:
// https://github.com/glathoud/js.metaret/issues/6

{
//#INLINE_BEGIN: inline to_be_inlined_imbricated()
var _undef_, _ret_;
//#INLINE_SET_INPUT_ARGS:
var _some_ = _undef_;
var _optional_ = _undef_;
var _parameters_ = _undef_;
//#INLINE_IMPLEMENT:
do {
{
    'still testing :)';
    // https://github.com/glathoud/js.metaret/issues/6

    var _arr_ = [];

    for (var _i_ = 0; _i_ < 3; _i_++)
    {   
        {
//#INLINE_BEGIN: inline var _a_ = to_be_inlined()
var _undef_1, _ret_1;
//#INLINE_SET_INPUT_ARGS:
var _opt1_ = _undef_1;
var _opt2_ = _undef_1;
//#INLINE_IMPLEMENT:
do {
{
    'not doing much, just testing :)';
    _opt1_ = 1 + (_opt1_ || 0) + (_opt2_ || 0);
    if (('undefined' !== typeof console)  &&  console.log)
        console.log('to_be_inlined: opt1 result:', _opt1_);

    // https://github.com/glathoud/js.metaret/issues/7

    // To test the detection of infinite `inline` recursion
    // uncomment the following line. An error should be thrown.
    // inline to_be_inlined_imbricated();

    _ret_1 =  _opt1_; break;

    this.line.will.never.be.reached();
}
} while (false);
var _a_ = _ret_1;
//#INLINE_END: inline var _a_ = to_be_inlined()
};     
        _arr_.push( _a_ );
    }

    _ret_ =  _arr_; break;
}
} while (false);
//#INLINE_END: inline to_be_inlined_imbricated()
};

}

//#BUILD_END_FILE: "jsm_dev/expl_inline_use.jsm"


