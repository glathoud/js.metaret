/*global need$ lightparse */

if (typeof lightparse === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "lightparse.js" );

(function (global) {

    var       INLINE = 'inline'
    , LIGHTPARSE_OPT = { 
        extraReservedArr  : [ INLINE ]
        , extraBracketArr : [ { open : INLINE, close : ';', typebracket : INLINE, ignore_unbalanced : true } ]
    }
    ;
    
    global.inline = inline;

    function inline( code )
    // Turn a .js file into another .js file, with `inline` statements
    // hygienically expanded.
    //
    // Returns another code string.
    {
        console.log('xxx inline', code.substring(0,100))
        var lp = lightparse( code, LIGHTPARSE_OPT );

        console.log('xxx inline lp')
        console.log(lp);

        return code;
    }

})(this);
