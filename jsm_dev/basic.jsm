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

metafun fact( self, k, acc )
{
    acc  ||  (acc = 1);
    if (k > 1)
        metaret self, k - 1, acc * k; // anonymous self-recursion
    else
        return acc;
}

metafun gcd( self, a, b )
{
    if (a > b)
        metaret self, a-b, b;
    
    if (b > a)
        metaret self, b-a, a;
    
    return a; 
}

metafun isEven( self, n )
{
    if (n > 0)
        metaret isOdd, n - 1; // mutual recursion

    if (n < 0)
        metaret self, -n;

    return true;
}

(function (global) {

    global.isOdd = isOdd;

    metafun isOdd( self, n )
    {
        if (n > 0)
            metaret isEven, n - 1;

        if (n < 0)
            metaret self, -n;

        return false; 
    }

})(this);
