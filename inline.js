/*global need$ load lightparse lp2fmtree console print JSON*/

if (typeof lightparse === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "lightparse.js" );

if (typeof lp2fmtree === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "lp2fmtree.js" );

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
    ,     RETURN = 'return'
    ,        VAR = 'var'
    ,    VARDECL = 'vardecl'
    ;
    
    global.inline = inline;

    function inline( code, /*?object?*/workspace, /*?object?*/opt_code_info, /*?array?*/error_inline_stack )
    // Remove `inline` statements, replace them with hygienic inlining 
    // of the called function.
    //
    // Returns: another code string.
    //
    // Examples:
    // {{{
    // inline var result = f(x,y,z);
    //
    // inline result = f(x,y,z);
    //
    // inline f(x,y,z);
    // }}}
    //
    // See also:
    // 
    // issue [#3](https://github.com/glathoud/js.metaret/issues/3) 
    // 
    // ./jsm_dev/expl_longer.jsm
    //
    // Guillaume Lathoud
    // glathoud@yahoo.fr
    {
        workspace  ||  (workspace = {});

        error_inline_stack  ||  (error_inline_stack = []);
        
        // Parse this piece of code: find inline statements.

        var      lp = lightparse( code, LIGHTPARSE_OPT )
        ,        fm = lp2fmtree( lp )
        
        ,       all = lp.all
        , inlineArr = all
            .map( function (o, ind) { 
                var ret = getInlineInfo( o, ind, all, code ); 
                if (ret) 
                {
                    ret.begin = ret.o.begin;
                    ret.end   = ret.args.end;
                    ret.str   = code.substring( ret.begin, ret.end );
                }
                return ret;
            })
            .filter( function (info) { return info; } )
        ;

        var lastname2fmarr = fm.lastname2fmarr;

        var key = opt_code_info  ?  JSON.stringify( opt_code_info )  :  code;
        
        error_inline_stack.push( { key : key, code : code, workspace : workspace, opt_code_info : opt_code_info } )
        
        if (key in workspace)
        {
            var newcode = workspace[ key ].newcode;
            
            if ('string' !== typeof newcode)
            {
                if ('undefined' !== typeof console  &&  console  &&  console.error)
                {
                    console.error( 'error_inline_stack (summary):\n ' + error_inline_stack.map( function (x) { return '\n' + x.key.substring(0,96) + (x.key.length < 96  ?  ''  :  '...'); } ).join( '\n\n###\n' ) );
                    console.error( 'error_inline_stack (full):');
                    console.error( error_inline_stack );
                }
                throw new Error( 'inline error: Most likely you have an infinite `inline` recursion. Consider using `metafun` and `metaret` instead.' );
            }
            
            return newcode;
        }

        workspace[ key ] = {
            code_info   : opt_code_info  // e.g. path of the file
            , inlineArr : inlineArr
            , lastname2fmarr : lastname2fmarr
            , lp : lp
            , fm : fm
        };
        
        if (!inlineArr.length)
            return workspace[ key ].newcode = code;

        // For each inline statement, look for an unambiguous match,
        // in this piece of code, else in another one (workspace).

        for (var i = inlineArr.length; i--;)
        {
            var one = inlineArr[ i ];

            // Try first in the same piece of code.

            one.fmScopePath = getFmScopePath( fm, one );

            var local_fmCallMatch = getFmCallMatch( fm, one, one.fmScopePath );
            if (local_fmCallMatch)
            {
                one.hasLocalMatch = true;
                one.fmCallMatch   = local_fmCallMatch;
                one.matchKey      = key;
            }
            else
            {
                // Try second in other pieces of codes (typically other files).

                var matches  = []
                ,   callname = one.call.name
                ;
                (callname || 0).substring.call.a;

                for (var other_key in workspace) { if (workspace.hasOwnProperty( key )) {

                    if (key === other_key)
                        continue;
                    
                    var other_stuff          = workspace[ other_key ]
                    ,   other_lastname2fmarr = other_stuff.lastname2fmarr
                    ,   other_fmarr = other_lastname2fmarr[ callname ]
                    ,   other_n     = other_fmarr  &&  other_fmarr.length
                    ;
                    if (other_n === 1)
                    {
                        if (one.fmCallMatch)
                        {
                            throw new Error( 'Ambiguous match for inline call "' + callname + '" found between the 2 pieces: ' + one.matchKey + 
                                             '\n --- and --- \n' + other_key 
                                           );
                        }
                        
                        one.hasLocalMatch   = false;
                        one.fmCallMatch     = other_fmarr[ 0 ];
                        one.matchKey        = other_key;

                        // Globals are permitted (e.g. to access some
                        // tools), but not local closure in some
                        // parent function, because the latter would
                        // be lost when inlining the body.
                        // 
                        // See also:
                        // https://github.com/glathoud/js.metaret/issues/7
                        // 
                        // And the test in:  ./jsm_dev/expl.test.js
                        check_no_local_closure( one.fmCallMatch );
                    }
                    else if (other_n === 2)
                    {
                        throw new Error( 'Ambiguous match for inline call "' + callname + '" found within piece "' + other_key );
                    }
                }}
            }

            if (!one.fmCallMatch)
                throw new Error( 'inline error: when inlining within a file, the source body must be visible to the target inline location.' );
            
            // beginner help: detect `arguments` usage
            // https://github.com/glathoud/js.metaret/issues/10
            var matchBegin   = one.fmCallMatch.begin
            ,   matchEnd     = one.fmCallMatch.end
            ,   argumentsArr = lp.identifierObj[ 'arguments' ]  ||  []
            ;
            if (argumentsArr.some( function (x) { return matchBegin <= x  &&  x < matchEnd; } ))
                throw new Error( 'inline error: it is forbidden to use `arguments` in the body of the function to be inlined.' );
        }
        
        // Actually inline
        
        var newcode = code;
        for (var i = inlineArr.length; i--;)
        {
            var one = inlineArr[ i ]
            , begin = one.begin
            ,   end = one.end
            ;
            newcode = newcode.substring( 0, begin ) +

            // Quick implementation to support imbricated inlines.
            // https://github.com/glathoud/js.metaret/issues/6
            inline( getInlineCodeHygienic( lp.identifierObj, fm, one ), workspace, /*opt_code_info:*/null, error_inline_stack ) + 
                
            newcode.substring( end )
            ;
        }
        
        return workspace[ key ].newcode = newcode;
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


    function getInlineCodeHygienic( identifierObj, fm, one )
    {
        var error;

        var fmScopePath = one.fmScopePath
        ,   fmCallMatch = one.fmCallMatch
        ;
        if (-1 < fmScopePath.indexOf( fmCallMatch ))
        {
            if ('undefined' !== typeof console)  
                console.error( 'Could not inline: self-recursion found for "' + fmCallMatch.fullname+ '".' );
            else if ('undefined' !== typeof print)
                print( '[ERROR] Could not inline: self-recursion found for "' + fmCallMatch.fullname+ '".' );

            // Just drop the "inline" identifier
            return one.str.substring( INLINE.length );
        }

        // Hygenic inlining: rename local variables and take a few
        // other precautions to guarantee the same functionality
        // as the original function call.
        
        // while true  .. break
        // _undef_
        // _ret_
        // var x; -> var x = _undef_; // (e.g. looping use case)
        // return -> _ret_ = ; break;

        var io = Object.create( identifierObj );

        var undefN = getNewName( 'undef', io )
        ,     retN = getNewName( 'ret',   io )

        , param_arr    = fmCallMatch.param_arr
        , paramN_arr   = param_arr.map( function (name) { return getNewName( name, io ); } )
        , paramN_map   = getMapping( param_arr, paramN_arr )

        , vardeclArr   = fmCallMatch.vardeclArr
        , varnameArr   = vardeclArr.map( function (x) { return x.name; } )
        , vardeclN_arr = varnameArr.map( function (name) { return getNewName( name, io ); } )
        , vardeclN_map = getMapping( varnameArr, vardeclN_arr )

        , body = fmCallMatch.body
        , body_begin = fmCallMatch.body_node.begin
        , body_end   = fmCallMatch.body_node.end
        , body_length = body_end - body_begin
        , toReplace = []

        , body_lp = lightparse( body, LIGHTPARSE_OPT )
        ;
        
        // Prepare: Will replace variable names

        for (var i = body_lp.identifierArr.length; i--;)
        {
            var ident = body_lp.identifierArr[ i ]
            ,  newstr = paramN_map[ ident.name ]  ||  vardeclN_map[ ident.name ]
            ;
            if (newstr)
                toReplace.push( { o : ident, newstr : newstr } );
        }
        
        // Prepare: Will replace returns

        for (var i = body_lp.bracketextraArr.length; i--;)
        {
            var brack = body_lp.bracketextraArr[ i ];
            if (brack.typebracket !== RETURN)
                continue;
            
            toReplace.push( { o : { begin : brack.begin
                                    , end : brack.begin + RETURN.length
                                  }
                              , newstr : retN + ' = '
                            }
                          );
            toReplace.push( { o : { begin : brack.end
                                    , end : brack.end
                                  }
                              , newstr : ' break;'
                            }
                          );
        }
        
        toReplace.sort( function (a,b) { 
            var error;
            return a.o.begin < b.o.begin  ?  -1
                :  a.o.end > b.o.end  ?  +1
                :  error.bug
            ;
        });
        
        // Actually replace

        var newbody = body;

        for (var i = toReplace.length; i--;)
        {
            var r = toReplace[ i ];
            newbody = newbody.substring( 0, r.o.begin )
                + r.newstr
                + newbody.substring( r.o.end )
            ;
        }
        
        // Set input argument values.

        var oas = one.args.sepSplit
        , set_args_arr = paramN_arr.map( function (pN, i) {
            return pN + ' = ' + 
                (i < oas.length  
                 ?  oas[ i ].str  // argument given
                 :  undefN        // argument missing
                ) +
                ';'
            ;
        });
        
        // Beginning: Make sure "undefined" declarations work (e.g. when looping, need to reset such variables)
        
        var var_decl_undef_arr = []
        ,   var_decl_undef_set = {}
        ;

        for (var n = body_lp.bracketextraArr.length, i = 0; i < n; i++)
        {
            var brack = body_lp.bracketextraArr[ i ];
            if (brack.typebracket !== VAR)
             continue;
            
            var vdArr = brack.vdArr;
            for (var nj = vdArr.length, j = 0; j < nj; j++)
            {
                var vd = vdArr[ j ];
                if (!vd.rightstr  &&  !(vd.leftstr in var_decl_undef_set))
                {
                    var_decl_undef_arr.push( vardeclN_map[ vd.leftstr ] + ' = ' + undefN );
                    var_decl_undef_set[ vd.leftstr ] = 1;
                }
            }
        }
        
        // Wrap the whole thing using a while loop.

        var bodyAlreadyCurly = /^\s*\{[\s\S]*?\}\s*$/.test( newbody );

        var newcode = [ '{'
                        , '//#INLINE_BEGIN: ' + one.str.replace( /\r\n/g, ' ' ) // On top, put the original "inline" call in a comment.
                      ]
            .concat( [ 'var ' + undefN + ', ' + retN + ';' ] )
            .concat( [ '//#INLINE_SET_INPUT_ARGS:' ] )
            .concat( set_args_arr )
            .concat( var_decl_undef_arr.length 
                     ? [ 'var ' + var_decl_undef_arr.join( ', ' ) + ';' ]
                     : []
                   )
            .concat( [ '//#INLINE_IMPLEMENT:' ] )
            .concat( [ 'do {' ] )
            .concat( newbody )
            .concat( [ '} while (false);' ] )
            .concat( one.inlinetype === CALL  ?  []  
                     : one.inlinetype === ASSIGN  ?  [ one.identifier.name + ' = ' + retN + ';' ] 
                     : one.inlinetype === VARASSIGN  ?  [ 'var ' + one.identifier.name + ' = ' + retN + ';' ] 
                     : error.bug
                   )
            .concat( [ '//#INLINE_END: ' + one.str.replace( /\r\n/g, ' ' ) ] ) // On the bottom as well, put the original "inline" call in a comment.
            .concat( [ '}' ] )
            .join( '\n' )
        ;
        
        return newcode;
    }

    function getMapping( arr_in, arr_out )
    {
        var ret = {};
        for (var i = arr_in.length; i--;)
            ret[ arr_in[ i ] ] = arr_out[ i ];
        
        return ret;
    }

    function getNewName( name, io )
    {
        var base = '_' + name + '_'
        ,   i    = ''
        ,   newname
        ;
        while ((newname = base + i) in io)
            i = +i+1;  // i: '', 1, 2, 3, ...

        io[ newname ] = 1;
        return newname;
    }

    function getFmScopePath( fmtree, one, sofar )
    {
        sofar  ||  (sofar = []);
        for (var n = fmtree.length, i = 0; i < n; i++)
        {
            var fm = fmtree[ i ];
            if (fm.begin <= one.begin  &&  one.end <= fm.end)
            {
                sofar.push( fm );
                getFmScopePath( fm.children  ||  [], one, sofar );
                break;
            }
        }
        return sofar;
    }
    
    function getFmCallMatch( fmtree, one, fmScopePath )
    {
        var callname = one.call.name
        ,   all      = fmtree.concat( fmScopePath )
        ,   match
        ;
        
        top_loop: for (var i = all.length; i--;)  // i--: Important: search locally first
        {
            var fm = all[ i ];

            var fmc = fm.children  ||  [];
            for (var j = fmc.length; j--; )
            {
                var c = fmc[ j ];
                if (c.lastname === callname)
                {
                    match = c;
                    break top_loop;
                }
            }

            if (fm.lastname === callname)
            {
                match = fm;
                break top_loop;
            }

            // Not found, move one scope upwards.
        }
        
        if (match)
            check_bound_variables_all_shared( match, fmScopePath.slice( -1 )[ 0 ] );

        return match;
    }

    // ---------- Checks

    function check_no_local_closure( fm )
    {
        var vuo = fm.varuseObj
        ,   vdo = fm.vardeclObj
        ;
        for (var name in vuo) { if (!(name in vdo)) {
            
            // Not declared here. 
            // -> global: ok.
            // -> local declared in a parent function (closure): forbidden.
            // 
            // See also:
            // https://github.com/glathoud/js.metaret/issues/7
            // ./jsm_dev/expl.test.js
            var pFm = fm;
            while (pFm = pFm.parent)
            {
                if (name in pFm.vardeclObj)
                {
                    throw new Error('inline error: when inlining across files, the body to inline MUST NOT use locally bound variables (closures). (It may use globals, though.)');
                }
            }
            

        }}
        
    }


    function check_bound_variables_all_shared( match, target_inline_fm )
    // https://github.com/glathoud/js.metaret/issues/7
    // 
    // If the `match` body source has any bound variables, they must
    // be shared with the target `one` location.
    //
    // In particular, we detect re-declaration ambiguities.
    //
    // See also failure detection examples in ./jsm_dev/expl.test.js
    {
        var bound = []
        ,   m_vuo = match.varuseObj
        ,   m_vdo = match.vardeclObj
        ;
        for (var name in m_vuo) { if (!(name in m_vdo)) { bound.push( name ); } }
        
        bound.forEach( check_declared_in_same_scope );

        function check_declared_in_same_scope( name )
        {
            var m_decl_scope = decl_scope( name, match )
            ,   t_decl_scope = decl_scope( name, target_inline_fm )
            ;
            if (m_decl_scope !== t_decl_scope)
                throw new Error( 'inline error: when inlining within a file, the source body and the target inline location must share their bound variables (if the source body has any).' );
        }

        function decl_scope( name, fm )
        // Returns the closest scope where `name` is declared (`fm` or
        // one of its parents), else `null` for a global variable.
        {
            return fm  
            ?  (fm.vardeclObj[ name ]  ?  fm  :  decl_scope( name, fm.parent ))
            :  null  // global variable
            ;
        }
    }

    
})(this);
