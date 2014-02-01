/*global need$ load lightparse console*/

if (typeof lightparse === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "lightparse.js" );

(function (global) {

    var       INLINE = 'inline'
    , LIGHTPARSE_OPT = { 
        extraReservedArr  : [ INLINE ]
    }

    , VARASSIGN = 'varassign'
    ,    ASSIGN = 'assign'
    ,      CALL = 'call'
    
    // xxx constants should be in a separate file
    ,   BRACKET = 'bracket'
    ,     ROUND = 'round'
    , IDENTIFIER = 'identifier'
    ,   RESERVED = 'reserved'
    ,        VAR = 'var'
    ,    VARDECL = 'vardecl'
    ;
    
    global.inline = inline;

    function inline( code )
    // Turn a .js file into another .js file, with `inline` statements
    // hygienically expanded.
    //
    // Returns another code string.
    {
        console.log('xxx inline', code.substring(0,100))
        var      lp = lightparse( code, LIGHTPARSE_OPT )
        ,       all = lp.all
        , inlineArr = all
            .map( function (o, ind) { return getInlineInfo( o, ind, all, code ); })
            .filter( function (info) { return info; } )
        ;
        if (!inlineArr.length)
            return code;

        console.log('xxx inline inlineArr', inlineArr)

        return code;
    }

    // --- Details

    function getInlineInfo( o, ind, all, code )
    {
        if (o.name !== INLINE)
            return;
        
        var v            // var        (optional)
        ,   identifier   // identifier (optional)
        ,   call         // call       (mandatory)
        ,   args         // call args  (mandatory)
        ;

        if ((call = all[ ind+1 ]).type === CALL  &&  
            (args = all[ ind+2 ]).type === BRACKET  &&  args.typebracket === ROUND)
        {
            return {
                o            : o
                , ind        : ind
                , inlinetype : CALL
                , call       : call
                , args       : args
            };
        }

        if ((identifier = all[ ind+1 ]).type === IDENTIFIER  &&  
            (call = all[ ind+2 ]).type === CALL  &&  
            (args = all[ ind+3 ]).type === BRACKET  &&  args.typebracket === ROUND  &&  
            /=/.test( code.substring( identifier.end, call.begin )))
        {
            return {
                o            : o
                , ind        : ind
                , inlinetype : ASSIGN
                , identifier : identifier
                , call       : call
                , args       : args
            };
        }

        var vc;
        if ((v = all[ ind+1 ]).type === BRACKET   &&  v.typebracket === VAR  &&
            (vc = v.children).length === 4  &&
            (identifier = vc[ 1 ]).type === VARDECL  &&  
            (call       = vc[ 2 ]).type === CALL  &&  
            (args       = vc[ 3 ]).type === BRACKET  &&  args.typebracket === ROUND  &&  
            /=/.test( code.substring( identifier.end, call.begin )))
        {
            return {
                o            : o
                , ind        : ind
                , inlinetype : VARASSIGN
                , identifier : identifier
                , call       : call
                , args       : args
            };
        }

        throw new Error( 'Unrecognized inline syntax.' );
    }

})(this);
