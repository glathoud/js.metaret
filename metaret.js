/*global document console load lightparse*/

// Guillaume Lathoud, 2011, 2013, MIT License, see ./LICENSE.TXT
// 
// Unit tests: ./metaret.html
//
// Idea:
//
// metafun fact( self, k, acc )
// {
//     acc || (acc = 1);
//     if (k > 1)
//        metaret self, k-1, acc*k;  // metacomposition (similar to [Backus78])
//     else
//        return acc;
// }
//
// Quick experiment in Javascript: Unroll the code similarly to [tomrec].
// -> Task: Detection of metaret + prevention of variable name collision
// (hygienic renaming).
//
// Mutual recursion is also supported, as shown in ./metaret_test.html
//
// 
// References
//
// [Backus78] "Can Programming Be Liberated from the von Neumann
// Style?  A Functional Style and Its Algebra of Programs", by John
// Backus, Communications of the ACM, August 1978 Volume 21 Number 8.
//
// [tomrec] http://glat.info/jscheck/tomrec_prod.html

if (typeof lightparse === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "lightparse.js" );

if (typeof lp2fmtree === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "lp2fmtree.js" );

;(function (global) {

    // The place of `self` in the parameters: 0:first place, 1:second
    // place, etc.
    var ACTION_PARAM = 0
    , METAFUN        = 'metafun'
    , METARET        = 'metaret'
    , EXTRA_RESERVED_ARR = [ METAFUN, METARET ]
    ,  EXTRA_BRACKET_ARR  = [ { open : METARET, close : ';', typebracket : METARET, ignore_unbalanced : true } ]
    ,     LIGHTPARSE_OPT = { extraReservedArr : EXTRA_RESERVED_ARR, extraBracketArr : EXTRA_BRACKET_ARR }
    ;

    // ---------- Public API

    global.MetaDecl      = MetaDecl;      // Returns nothing, declares a function in the global name space
    global.MetaFunction  = MetaFunction;  // MetaFunction returns a function. Optionally you can give a local name space object.
    global.metaparse     = metaparse;     // Returns nothing. Search for script tags with type="text/js-metaret", parse and apply them.

    // ---------- Public API implementation
    
    var _metaparse_rx     = /\s*(metafun|function)\s*(\S+)\s*\(\s*([^\)]+?)\s*\)((?![\r\n]\s*(metafun|function))[\s\S])*/g
    ,   _metaparse_one_rx = /^\s*(metafun|function)\s*(\S+)\s*\(\s*([^\)]+?)\s*\)\s*\{\s*(((?![\r\n]\s*(metafun|function))[\s\S])*)\s*\}\s*$/
        , _metaparse_one_start_rx = /^\s*(metafun|function)\s/
        , _metaparse_one_start_function_rx = /^\s*function\s/
        ;
    function metaparse( /*?string?*/code, /*?object?*/name2info )
    {
        name2info  ||  (name2info = _global_name2info);

        var noli = code  ?  [ code ]  :  document.getElementsByTagName( 'script' )
        ,   ret  = []
        ;
        for (var n = noli.length, i = 0; i < n; i++)
        {
            var     s = noli[ i ]
            , sString = 'string' === typeof s
            ;
            if (!sString  &&  'text/js-metaret-decl' !== s.getAttribute( 'type' ))
                continue;
            
            var metacode = sString  ?  sString  :  s.textContent  ||  s.innerText
            ,   lp       = lightparse( metacode, LIGHTPARSE_OPT )
            ,   fmtree   = lp2fmtree( lp )
            ;
            rec_decl( fmtree, /*isGlobal:*/true, name2info, ret );
        }

        return ret;
    }

    function rec_decl( fmtree, /*boolean*/isGlobal, /*object*/name2info, /*?array?*/output )
    {
        output  ||  (output = []);

        if (fmtree instanceof Array)
        {
            for (var n = fmtree.length, i = 0; i < n; i++)
                rec_decl( fmtree[ i ], isGlobal, name2info, output );
        }
        else
        {
            if (fmtree.children)
                rec_decl( fmtree.children, /*isGlobal*/false, name2info, output );
            
            
            Decl( fmtree.fullname, fmtree.param_str, fmtree.body, fmtree.children, fmtree.isFunction, name2info );

            output.push( { fullname : fmtree.fullname, fmtree : fmtree, info : name2info[ fmtree.fullname ] } );
        }
        return output;
    }
    
    var _global_name2info = {};    

    function MetaDecl( /*single argument: code string | three arguments: name*/code_or_name, /*?string?*/param, /*?string?*/body, /*?array?*/children, /*?object?*/name2info )
    {
        Decl( code_or_name, param, body, children, false, name2info  ||  _global_name2info );
    }

    function FunDecl( /*single argument: code string | three arguments: name*/code_or_name, /*?string?*/param, /*?string?*/body, /*?array?*/children, /*?object?*/name2info )
    {
        Decl( code_or_name, param, body, children, true, name2info  ||  _global_name2info );
    }

    function Decl( /*single argument: code string | three arguments: name*/code_or_name, /*?string?*/param, /*?string?*/body, /*?array?*/children, /*?boolean?*/is_fun, /*?object?*/name2info )
    {
        children  ||  (children = []);

        is_fun != null  ||  (is_fun = _metaparse_one_start_function_rx.test( code_or_name ));

        name2info  ||  (name2info = _global_name2info);
                
        var param_null = param == null
        ,    body_null = body  == null
        ;
        if (param_null ^ body_null)
            throw new Error( 'Decl: invalid usage. Give either both `param` and `body`, or none of them.' )

        if (param_null)
        {
            // --- Single code string

            // For convenience, prepend metafun|function automatically.
            var code  = _metaparse_one_start_rx.test( code_or_name )  ?  code_or_name  :  (is_fun  ?  'function'  :  'metafun') + ' ' + code_or_name
            ,   mo    = _metaparse_one_rx.exec( code )
            ,   name  = mo[ 2 ]
            ;
            param = mo[ 3 ];
            body  = mo[ 4 ];
            
            Decl( name, param, body, children, is_fun, name2info );
            return;
        }
        
        // --- All three strings: name, param, body.

        var name = code_or_name;

        // Support for dotted names: automatically any missing part
        // within the global object.
        
        var dot_arr = name.split( '.' )
        ,   g       = global
        ;
        while (dot_arr.length > 1)
        {
            var next = dot_arr.shift();
            g = g[ next ]  ||  (g[ next ] = {});
        }
        
        // Now we are ready to create the metafunction
        
        var remember = ( 
            '\n' + (is_fun  ?  'function'  :  'metafun' ) + ' ' + name + '\n( ' + param + ')'
        ).replace( /([\r\n])/g, '$1// --- ' )
            + '\n\n'
        ;

        g[ dot_arr[ 0 ] ] = (is_fun  ?  NormalFunction  :  MetaFunction)( name, param, remember + body, name2info, children );

    }
    
    function NormalFunction( name, param, body, name2info, /*?array?*/children )
    {
        _checkNameNotUsedYet( name2info, name );

        if (children  &&  children.length)
        {
            var rx = /\}\s*/
            ,   ok = rx.test( body )
            ;
            body = ok  &&  body.replace( rx, '\n\n' + childrenCode( name2info, children ) + '\n\n}' )
        }
        
        var impl = new Function( param, body )

        ,   info = name2info[ name ] = 
            { 
                name        : name  
                , lastname  : name.replace( /^.*\./, '' )
                , origParam : param  
                , origBody  : body  
                , impl      : impl
                , name2info : name2info 

                // Store also for childrenCode
                , param : param
                , body  : body

            }
        ;


        return impl;
    }

    function MetaFunction(
        /*string*/name
        , /* string like "self,a,b,c" */param
        , /*string: code*/body
        , /*object*/name2info
        , /*array*/children
    ) 
    // Returns a function `ret`. So it does not matter whether you
    // use `new MetaFunction(...)`, or just `MetaFunction(...)`.
    //
    // Advice: use the same name string as your target variable name:
    /*
      var fact = MetaFunction
      ( 
      'fact'            // <- same name string as the variable name `fact`
      , 'self,k,acc'     
      , [ 
      'acc  ||  (acc = 1);'
      , 'if (k > 1)'
      , '    metaret self, k - 1, acc * k;' 
      , 'else'
      , '    return acc;'
      ].join( '\n' )
      );
    */
    {        
        _checkNameNotUsedYet( name2info, name );

        var info     = name2info[ name ]  = { name        : name  
                                              , lastname  : name.replace( /^.*\./, '' )
                                              , origParam : param  
                                              , origBody  : body  
                                              , impl      : null         // Where we'll store the resulting unwrapped implementation, as soon as we need it.
                                              , name2info : name2info 
                                            }
        , paramArr   = info.paramArr      = _checkExtractParam( param )  
        , varArr     = info.varArr        = _extractVar( body )
        , metaretArr = info.metaretArr    = _checkExtractMetaret( body, paramArr.self, name )
        , solve      = info.solve         = _createSolver( info, children )
        ;
        
        if (metaretArr.hasAll( name2info ))
        {
            // If we can solve right away (e.g. self-recursion case),
            // then we do not need the `function ret()` check anymore.
            solve();
            ret = info.impl;
        }
        
        ret.getImpl = ret_getImpl;

        return ret;

        // Solve later (e.g. mutual recursion case where some of the
        // metaret actions (= other metafunctions) are not known yet).

        function ret (/*...*/) 
        { 
            if (!info.impl)
                solve();
            
            return info.impl.apply( null, arguments );
        }

        // For convenience : to see the generated code from outside.

        function ret_getImpl()
        {
            if (!info.impl)
                solve();

            return info.impl;
        }

    }

    // ---------- Private constant
    
    var _RX_NAME      = /^[a-zA-Z_][\w\.]*$/
        , _RX_PARAM   = /^((?:^\s*|\s*,\s*)[a-zA-Z_]\w*(?:\s*))+$/
        , _RX_ACTION  = /^[a-zA-Z_]\w*?(\.[a-zA-Z_]\w*?)*$/
    , _Aps            = Array.prototype.slice
    ;

    // ---------- Private function

    function _createSolver( info, children )
    {
        var name     = info.name
        , metaretArr = info.metaretArr
        , paramArr   = info.paramArr
        , varArr     = info.varArr
        , origBody   = info.origBody

        , name2info  = info.name2info

        , namespace_arr = name.split( '.' )
        ;

        return solve;
        
        function solve()
        {
            if (info.impl)  
                return;  // Done already

            // Not done yet. Make sure it is feasible.

            if (!metaretArr.hasAll( name2info ))
                throw new Error( 'MetaFunction : _createSolver : solve() could not resolve all dependencies yet for metafunction "' + name + '".' );
            
            if (!metaretArr.length)
                solveNoMetaret();
            else if (!metaretArr.hasOther())
                solveSelf();
            else
                solveMulti();
        }

        function solveNoMetaret()
        {
            console.warn( 'MetaFunction : _createSolver:solveNoMetaret() no #metaret in body of metafunction "' + name + '".' );
            
            var newParam = info.newParam = paramArr
            , newBody    = info.newBody  = origBody.replace( /^\s+$/mg, '' )
            ;
            info.impl = new Function( newParam.join( ',' ), newBody );
        }

        function solveSelf()
        {
            var against = [ paramArr, origBody ]
            , label     = _generateAddName( 'L_' + name, against )  // Avoid collision
            , undefName = _generateAddName( 'undef', against )  // Avoid collision   
            , newParam  = info.newParam = paramArr
            , i4        = _indentGen( 4 )
            , i8        = _indentGen( 8 )
            , newBody   = info.newBody  = i4( 
                'var ' + undefName + ';\n' + 
                label + ': while (true) {\n' + 
                    i4( _reinitUndef( _replaceMetaretWithContinue( name2info, metaretArr, origBody, label, paramArr )
                                      , info.varArr
                                      , undefName )
                        + '\n'
                      ) +
                    '  return;\n' +
                    '}\n' +
                    
                (children  &&  children.length  ?  '\n\n' + childrenCode( name2info, children ) + '\n'  :  '')
            )
                .replace( /^\s+$/mg, '' )
            ;
            
            info.impl = new Function( newParam.join( ',' ), newBody );

            // Store also for childrenCode
            info.param = newParam;
            info.body  = newBody;
        }

        function solveMulti()
        {
            // For simplicity and readability we opted for switch
            // (flat, maybe less variable name collision issues)
            // rather than expanding recursively (faster than switch,
            // but code duplication).
            
            var  maha = metaretArr.hasAll()
            
            // Preserve order and prevent duplicate code
            , infoArr = [ info ].concat( maha.infoArr.filter( function (other) { return other !== info; } ) )

            // Fullnames (including namespace)
            , nameArr = infoArr.map( function (info) { return info.name; } )

            , against = infoArr.map( function (info) { return info.paramArr.concat( info.origBody ); } )
            , switch_ind_name = nameArr.switch_ind_name = _generateAddName( 'switch_ind', against )
            , switchLabel     = nameArr.switchLabel     = _generateAddName( 'L_switch', against )
            , undefName       = _generateAddName( 'undef', against )  // Avoid collision   
            ; 
            
            var i4     = _indentGen( 4 )
            , i8       = _indentGen( 8 )
            , i12      = _indentGen( 12 )
            , newParam = info.newParam = paramArr
            , newBody    = info.newBody = i4( [
                'var ' + undefName + ';'
                , 'var ' + switch_ind_name  + ' = 0;'
                , switchLabel + ': while (true) {'
                , i4( 'switch (' + switch_ind_name + ') {' )
            ].concat( 
                infoArr.map( info2code )
            ).concat( [
                i4( '}' )
                , i4( 'return;' )
                , '}'
                , ''
            ].concat( 

                children  &&  children.length

                    ?  [ ''
                         , ''
                         , childrenCode(
                             name2info
                             , children
                                 .filter( function (kid) { 
                                     (kid.fullname || 0).substring.call.a; 
                                             return 0 > nameArr.lastIndexOf( kid.fullname ); 
                                 } )
                         )
                       ] 

                         :  []

            )))
                .join( '\n' )
                .replace( /^\s+$/mg, '' )
            ;
            
            info.impl = new Function( newParam.join( ',' ), newBody );

            function info2code( info, ind )
            {
                var code = [ 
                    ''
                    , 'case ' + ind + ':' 
                ]
                
                code.push( i4( _reinitUndef
                               ( 
                                   _replaceMetaretWithContinue( name2info, info.metaretArr, info.origBody, nameArr, against )
                                   , info.varArr
                                   , undefName
                               )
                             ) 
                         );
                
                code.push( 'break;' );
                code.push( '' );
                return code.map( i8 ).join( '\n' );
            }
        }

    }  // end of function _createSolver

    function childrenCode( /*object*/name2info, /*?array?*/children )
    {
        var arr = []
        
        for (var n = children.length, i = 0; i < n; i++)
        {
            var kid = children[ i ]
            ,  info = name2info[ kid.fullname ]
            ;
            arr.push( '\n' );
            arr.push( 'function ' + info.lastname + '(' + 
                      ('string' === typeof info.param  ?  info.param  :  info.param.join( ',' ))
                      + ')\n'
                      + info.body
                    );
        }
        
        return arr.join( '\n' );
    }


    // ---------- Private implementation: deeper

    function _checkNameNotUsedYet(/*object*/name2info, /*string*/name)
    {
        if (!_RX_NAME.test( name ))  
            throw new Error(
                'MetaFunction : _checkNameNotUsedYet : Invalid function name "' + name + '". The function name must match [a-zA-Z_][a-zA-Z_0-9]*'
            );

        if (name2info_has( name2info, name, [] ))
            throw new Error(
                'MetaFunction : _checkNameNotUsedYet : Duplicate function name "' + name + '". The function name must be unique: ' + 
                    'MetaFunction can be called one time only with a given name.' 
            );

    }

    function _checkExtractParam( /*string*/param )  
    {
        // Remove comments
        param = param.replace( /\/\*.*?\*\//g, '' );

        if (!_RX_PARAM.test( param ))
            throw new Error('MetaFunction : _checkExtractParam : Invalid parameters string, the string must be like "self,x,y,z".')

        var ret = param.replace(/\s+/g, '' ).split( ',' );
        ret.self = ret.splice( ACTION_PARAM, 1 )[ 0 ];
        return ret;
    }

    function _extractVar( /*string*/body )
    {
        var lp = lightparse( body, LIGHTPARSE_OPT )
        ,   iA = lp.identifierArr
        , ret = []
        ;
        for (var n = iA.length, i = 0; i < n; i++)
        {
            var x = iA[ i ];
            ret.push( { text    : x.str
                        , end   : x.begin + x.str.length
                        , start : x.begin
                        , isVardecl : x.isVardecl
                      }
                    );
            
        }
        return ret;
    }

    function _checkExtractMetaret( /*string*/body, /*string*/self, /*string*/selfName )
    {
        var lp = lightparse( body, LIGHTPARSE_OPT )
        ,  beA = lp.bracketextraArr
        ,  ret = []
        ;

        // Remember

        ret.body     = body;
        ret.self     = self;
        ret.selfName = selfName;

        // Parse

        for (var beA_n = beA.length, beA_i = 0; beA_i < beA_n; beA_i++)
        {
            var x = beA[ beA_i ];
            if (x.typebracket !== METARET)
                continue;

            var exprArr = x.sepSplit.map( function (o) { return o.str.replace( /^\s+/, '' ).replace( /\s+$/, '' ); } )
            ,    action = exprArr.length > ACTION_PARAM  &&  exprArr.splice( ACTION_PARAM, 1 )[ 0 ]
            ;
            if (!action)
                throw new Error('MetaFunction : _checkExtractMetaret() : A `metaret` needs at least an action.');
            
            if (action !== self  &&  !_RX_ACTION.test( action ))
            {
                throw new Error('MetaFunction : _checkExtractMetaret : Invalid action "' + action + '". action must be self ("' + self + 
                                '") or a named action (like "myOtherAction" or "my.other.action" or "my_other_action").'
                               );
            }
            
            var isSelf = action === self  ||  action === selfName;

            ret.push( { exprArr  : exprArr  // array of string
                        , isSelf : isSelf
                        , action : isSelf ? selfName : action   // string
                        , end    : x.end
                        , start  : x.begin
                        , namespace : selfName
                        , namespace_arr : selfName.split( '.' )
                      }
                    );
        }

        // Add convenience methods

        ret.hasOther = hasOther;
        ret.hasAll   = hasAll;

        return ret;
    }

    function hasOther()
    {
        var cache = 'hasOtherResult'; 
        if (cache in this)  
            return this[ cache ];

        var arr = [];

        for (var i = this.length; i--; )
        {
            if (!this[ i ].isSelf)
                arr.push( this[ i ].action );
        }
        
        return this[ cache ] = arr.length  &&  arr;
    }

    function hasAll(/*object*/name2info, /*?object?*/visited, /*?object?*/visitedObj, /*?array of string?*/visitedArr)
    {
        // Returns  false | array of strings
     
        var topLevel = arguments.length < 2;
        if (topLevel)
        {
            var cache = 'hasAllResult';
            if (cache in this)  
                return this[ cache ];

            // Init

            visitedObj = {};
            visitedArr = [];
        }

        // Do the (possibly recursive) search

        for (var i = this.length; i--; )
        {
            var x = this[ i ];
            if (x.isSelf)
                continue;

            var action = x.action;
            if (!action)
                throw new Error('MetaFunction : hasAll : Found a bug: empty metaret action (not permitted).');

            if (action in visitedObj)  // Prevent infinite cycles
                continue;
            
            var info = name2info_get( name2info, action, x.namespace_arr );
            if (!info)
                return false;       // Failure

            if (info.name in visitedObj)
                continue;

            visitedObj[ action ] = visitedObj[ info.name ] = info;
            visitedArr.push( info );
            
            if (!info.metaretArr.hasAll( name2info, visited, visitedObj, visitedArr ))
                return false;       // Failure
        }

        if (topLevel)
            // Finished
            return this[ cache ] = { 
                vObj : visitedObj
                , infoArr : visitedArr
            };  
        else
            // Not finished yet
            return true;
    }
    
    function _dropAction( /*array of string*/paramArr )
    {
        return paramArr.slice( 0, ACTION_PARAM ).concat( paramArr.slice( ACTION_PARAM + 1 ) );
    }

    function _generateAddName( /*string*/baseName, /*array of ... */against)
    {
        var newName = _generateName( baseName, against );
        against.push( newName );
        return newName;
    }

    function _generateName( /*string*/baseName /*, ... recursive array of strings: string | array of ( string | array of ..) ... */ )
    {
        // Generate a string based on `baseName`, that cannot be found
        // in any of the strings in `against`.

        var against = _Aps.call( arguments, 1 );  // array of ...

        for (var i = null ; true ; i = (i >>> 0) + 1)
        {
            var label = '_' + baseName.replace( /\./g, '_' ) + (i || '') + '_';
            
            if (!match( against ))
                return label;  // success
            
            // failure
        }

        function match( /*array | string*/against )
        {
            if (typeof against === 'string')
                return -1 < against.indexOf( label );

            // array -> recurse (OR logic)

            for (var i = against.length; i--; )
            {
                if (match( against[ i ] ))
                    return true;
            }

            return false;
        }
    }

    function _replaceMetaretWithContinue( 
        name2info
        , metaretArr
        , origBody
        , /*string | array of string*/label_or_nameArr 
        /*, ... recursive array of strings: string | array of ( string | array ...) ... */ 
    )
    {
        var against = _Aps.call( arguments, 1 )  // Including `origBody`, `label` and `newVarArr`
        , isLabel   = typeof label_or_nameArr === 'string'
        , ret       = origBody
        ;
        for (var i = metaretArr.length; i--; )   // Downward order important
        {
            var metaret = metaretArr[ i ]

            , before    = ret.slice( 0, metaret.start )
            , after     = ret.slice( metaret.end )
            ;

            // If there was a comment right on the metaret line,
            // make sure it appears at a readable position.
            var after_comment = ''
            ,   after_comment_mo = after.match( /^\s*(?:\/\/[^\r\n]*[\r\n]+|\/\*((?!\*\/)[\s\S]*)\*\/)/ )
            ;
            if (after_comment_mo)
            {
                after_comment = after_comment_mo[ 0 ];
                after         =  after.substring( after_comment.length );
            }
            
            var code = prepareCode( metaret, after_comment );
            
            ret = before + code + after;
        }
        
        return ret;

        function prepareCode( metaret, after_comment )
        {
            var code   = []
            , info     = name2info_get( name2info, metaret.action, metaret.namespace_arr )
            , paramArr = info.paramArr
            , exprArr  = metaret.exprArr
            ;
            
            if (paramArr.length !== exprArr.length)
            {
                throw new Error( 'MetaFunction : _replaceMetaretWithContinue : prepareCode : Invalid number of metaret arguments, action  "' + 
                                 metaret.action + '" expects ' + paramArr.length + ' arguments, but ' + exprArr.length + ' were given.'
                               );
            }

            if (paramArr.length === 1)
            {
                code.push( paramArr[ 0 ] + ' = ' + exprArr[ 0 ] + ';' );
            }
            else
            {
                for (var j = 0, i = 0, end = paramArr.length; i < end; i++)
                {
                    var varname  = paramArr[ i ];

                    // Special case: spare us the identity (no transformation)
                    if (varname === exprArr[ i ])
                        continue;

                    // General case                    
                    var newVarname = _generateName( varname, against );
                    against.push( newVarname );  // Prevent future collisions on this new name
                    
                    code.splice( j++, 0, 'var ' + newVarname + ' = ' + exprArr[ i ] + ';' );
                    code.push( varname + ' = ' + newVarname + ';' );
                }
            }

            if (isLabel)
            {
                // self-recursion case  (continue <Label>)
                code.push( 'continue ' + label_or_nameArr + ';' );
            }
            else
            {
                // mutual recursion case (switch style)

                var nameArr  = label_or_nameArr;

                if (metaret.action === metaretArr.selfName)
                {
                    // Actually a self-recursion (switch style)
                    code.push( 'continue ' + nameArr.switchLabel + '; // --- stay in: ' + metaret.action );
                }
                else
                {
                    // Moving to the body of another metafunction (switch style)
                    var switch_ind = nameArr.indexOf( info.name );
                    if (0 > switch_ind)
                    {
                        throw new Error('MetaFunction : _replaceMetaretWithContinue : prepareCode : Found a bug! Could not find the switch index of action "' +
                                        metaret.action + '"' 
                                       );
                    }
                    
                    code.push( nameArr.switch_ind_name + ' = ' + switch_ind + '; // --- go to: ' + metaret.action );
                    code.push( 'continue ' + nameArr.switchLabel + ';' );
                }
            }   
            
            if (after_comment)
                code.unshift( after_comment );

            code.unshift( '{' );
            code.push( '}' );

            return code.join( '\n' ) + '\n';
        }

    }

    function _reinitUndef( /*string*/body, /*array of string*/varArr, /*string*/undefName )
    {
        var toReinit = []
        , textSeen   = {}
        ;
        for (var i = 0, i_end = varArr.length; i < i_end; i++ )
        {
            var v  = varArr[ i ]
            , text = v.text
            ;
            if (text in textSeen)
                continue;
            textSeen[ text ] = 1;

            var maybeDeclInd = body.search(new RegExp( text + '\\s*[,;]'));
            
            if (v.isVardecl  &&  -1 < maybeDeclInd  &&  maybeDeclInd < v.end)
            {
                // Might well be a declaration without initialization.
                // To guarantee the same behaviour of the unrolled
                // code, we'll add an explicit reinit to `undefined`
                // at the begining of the unrolled code.
                toReinit.push( text );
            }
        }

        if (!toReinit.length)
            return body;  // unchanged

        return 'var ' + toReinit.map( function (s) { return s + ' = ' + undefName; } ).join( '\n, ' ) + (toReinit.length > 1 ? '\n' : '') + ';\n' + body;
    }

    function _indentGen( n ) 
    {
        var x = ' '
        , s   = []
        ;
        while (n)
        {
            if (n & 1)
                s.push( x );
            
            n >>= 1;
            x += x;
        }
        
        var s_indent = s.join( '' );
        return indentFun;

        function indentFun( /*string | array of string*/s_or_a)
        {
            if (typeof s_or_a === 'string')
            {
                var rxEol = /\n/;
                if (rxEol.test(s_or_a))
                    return s_or_a.split( rxEol ).map( indentFun ).join( '\n' );
                
                return s_indent + s_or_a;
            }
            
            return s_or_a.map( indentFun );
        }
    }

    function name2info_has( /*object <fullname> -> info*/name2info, /*string*/name, /*array of string*/namespace_arr )
    {
        return !!name2info_get( name2info, name, namespace_arr );
    }
    
    function name2info_get( /*object <fullname> -> info*/name2info, /*string*/name, /*array of string*/namespace_arr )
    {
        // Search first in the local namespace

        var fullname = namespace_arr.concat( name ).join( '.' );
        if (fullname in name2info)
            return name2info[ fullname ];

        // Else step up

        if (namespace_arr.length)
            return name2info_get( name2info, name, namespace_arr.slice( 0, -1 ) );

        // Else not found
        return false;
    }
    
})(this);
