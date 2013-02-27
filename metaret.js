// Guillaume Lathoud, 2011, MIT License, see ./LICENSE.TXT
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
// -> Task: Detection of metaret + prevention of variable name collision.
//
// (mutual recursion is also supported)
//
// To avoid having to parse the whole code, and traverse complex
// syntax trees [tomrec], I decided to use simple "flat" regexps, hash
// all variable names, and use double comma in metaret calls:
//
// fact = MetaFunction( 'fact', '#self,#k,#acc', [
//     '#acc || (#acc = 1);'
//     ,'   if (#k > 1)'
//     ,'      #metaret #self ,, #k-1 ,, #acc*#k;'
//     ,'   else'
//     ,'     return #acc;'
//   ].join( '\n' )
// );    
//
//
// [Backus78] "Can Programming Be Liberated from the von Neumann
// Style?  A Functional Style and Its Algebra of Programs", by John
// Backus, Communications of the ACM, August 1978 Volume 21 Number 8.
//
// [tomrec] http://glat.info/jscheck/tomrec_prod.html


/*global console*/

;(function (global) {

    // ---------- Public API

    global.MetaFunction  = MetaFunction;  // MetaFunction returns a function.
    global.metaparse     = metaparse;     // Returns nothing. Search for script tags with type="text/js-metaret", parse and apply them.

    // Constant that determines where the action (`self` etc) should be: 0: first place, 1: second place, etc.
    function ACTION_PARAM () { return 0; }
        
    // Read-only access         Convenience cast support.
    MetaFunction.ACTION_PARAM = ACTION_PARAM.toString = ACTION_PARAM.toValue = ACTION_PARAM;
    
    // ---------- Public API implementation

    var _metaparse_rx = /\s*#metafun\s*(\S+)\s*\(\s*([^\)]+?)\s*\)((?!#metafun)[\s\S])*/g
    ,  _metaparse_one_rx = /^\s*#metafun\s*(\S+)\s*\(\s*([^\)]+?)\s*\)\s*\{\s*(((?!#metafun)[\s\S])*)\s*\}\s*$/
    ;
    function metaparse()
    {
        var noli = document.getElementsByTagName( 'script' );
        for (var n = noli.length, i = 0; i < n; i++)
        {
            var s = noli[ i ];
            if ('text/js-metaret' !== s.getAttribute( 'type' ))
                continue;
            
            var metacode = s.textContent  ||  s.innerText
            ,   arr      = metacode.match( _metaparse_rx )
            ;
            
            for (var p = arr.length, j = 0; j < p; j++)
            {
                var one   = arr[ j ]
                ,   mo    = _metaparse_one_rx.exec( one )
                ,   name  = mo[ 1 ]
                ,   param = mo[ 2 ]
                ,   body  = mo[ 3 ]
                ;
                global[ name ] = MetaFunction( name, param, body );
            }
            
            
        }
        
    }


    var _name2info;

    function MetaFunction(/*string*/name, /* string like "#self,#a,#b,#c" */param, /*string, where all variable identifiers have a hash: #myVarname*/body) 
    {
        // Returns a function `ret`. So it does not matter whether you
        // use `new MetaFunction(...)`, or just `MetaFunction(...)`.
        //
        // Advice: use the same name string as your target variable name:
        /*
        var fact = MetaFunction
        ( 
            'fact'            // <- same name string as the variable name `fact`
            , '#self,#k,#acc'     // hashes in all identifiers to make parsing easy without a full-fledged JS parser
            , [ 
                '#acc  ||  (#acc = 1);'
                , 'if (#k > 1)'
                , '    #metaret #self ,, #k - 1 ,, #acc * #k;'       // double comma to make parsing easy without a full-fledged JS parser
                , 'else'
                , '    return #acc;'
            ].join( '\n' )
        );
        */
        
        _checkName( name );

        var info     = _name2info[ name ] = { name : name  ,  origParam : param  ,  origBody : body  ,  impl : null }
        , paramArr   = info.paramArr      = _checkExtractParam( param )  
        , varArr     = info.varArr        = _extractVar( body )
        , metaretArr = info.metaretArr    = _checkExtractMetaret( body, paramArr.self, name )
        , solve      = info.solve         = _createSolver( info )
        ;
        
        if (metaretArr.hasAll())
        {
            // If we can solve right away (e.g. self-recursion case),
            // then we do not need the `function ret()` check anymore.
            solve();
            ret = info.impl;
        }
        
        return ret;

        // Solve later (e.g. mutual recursion case where some of the
        // metaret actions (= other metafunctions) are not known yet).

        function ret (/*...*/) 
        { 
            if (!info.impl)
                solve();
            
            return info.impl.apply( null, arguments );
        }

    }

    // ---------- Private constant
    
    var _RX_NAME      = /^[a-zA-Z_]\w*$/
        , _RX_PARAM   = /^((?:^\s*|\s*,\s*)#[a-zA-Z_]\w*(?:\s*))+$/
        , _RX_ACTION  = /^[a-zA-Z_]\w*?(\.[a-zA-Z_]\w*?)*$/
        , _RE_VAR     = '(?:^|[^#])(#(?!metaret\\b)[a-zA-Z_]\\w*\\b)'
    , _RX_VAR         = new RegExp( _RE_VAR )
    , _RE_METARET     = '(?:^|[^#])#metaret\\s+((\\S[\\S\\s]*?\\s*)(,,\\s*\\S[\\S\\s]*?)*);'
    , _Aps            = Array.prototype.slice
    ;

    // ---------- Private static

    var _name2info = {};  // name -> metafunction information (dependencies, implementation, etc)

    // ---------- Private function

    function _createSolver( info )
    {
        var name     = info.name
        , metaretArr = info.metaretArr
        , paramArr   = info.paramArr
        , varArr     = info.varArr
        , origBody   = info.origBody
        ;

        return solve;
        
        function solve()
        {
            if (info.impl)  
                return;  // Done already

            // Not done yet. Make sure it is feasible.

            if (!metaretArr.hasAll())
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
            
            var newParam = info.newParam = _checkRemoveHash( paramArr )
            , newBody    = info.newBody  = _checkRemoveHash( paramArr.concat( varArr ).concat( [ '##' ] ) // We also simplify double ## into single #
                                                             ,  origBody )
            ;
            info.impl = new Function( newParam.join( ',' ), newBody );
        }

        function solveSelf()
        {
            var against = [ paramArr, origBody ]
            , label     = _generateAddName( 'L_' + name, against )  // Avoid collision
            , undefName = _generateAddName( 'undef', against )  // Avoid collision   
            , newParam  = info.newParam = _checkRemoveHash( paramArr )
            , i4        = _indentGen( 4 )
            , i8        = _indentGen( 8 )
            , newBody   = info.newBody  = i4( 
                'var ' + undefName + ';\n' + 
                label + ': while (true) {\n' + 
                    i4( _checkRemoveHash( paramArr
                                          .concat( varArr )
                                          .concat( [ '##' ] )   // We also simplify a double hash "##" into a single hash "#"
                                          , _reinitUndef( _replaceMetaretWithContinue( metaretArr, origBody, label, paramArr )
                                                          , info.varArr
                                                          , undefName )
                                        ) + '\n'
                      ) +
                    '  return;\n' +
                    '}\n'
            )
            ;
            info.impl = new Function( newParam.join( ',' ), newBody );
        }

        function solveMulti()
        {
            // For simplicity and readability we opted for switch
            // (flat, maybe less variable name collision issues)
            // rather than expanding recursively (faster than switch,
            // but code duplication).
            
            var nameArr  = [ name ].concat( metaretArr.hasOther() )
            , infoArr    = nameArr.map( function (n) { return _name2info[ n ]; } )
            , against    = infoArr.map( function (info) { return info.paramArr.concat( info.origBody ); } )
            , switch_ind_name = nameArr.switch_ind_name = _generateAddName( 'switch_ind', against )
            , switchLabel     = nameArr.switchLabel     = _generateAddName( 'L_switch', against )
            , undefName       = _generateAddName( 'undef', against )  // Avoid collision   
            ; 
            
            var i4     = _indentGen( 4 )
            , i8       = _indentGen( 8 )
            , i12      = _indentGen( 12 )
            , newParam = info.newParam = _checkRemoveHash( paramArr )
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
            ])).join( '\n' )
            ;
            
            info.impl = new Function( newParam.join( ',' ), newBody );

            function info2code( info, ind )
            {
                var code = [ 
                    ''
                    , '/* ' + info.name + ' */'
                    , 'case ' + ind + ':' 
                ]
                
                code.push( i4( _checkRemoveHash( info.paramArr.concat( info.varArr ).concat( [ '##' ] )
                                                 , _reinitUndef( 
                                                     _replaceMetaretWithContinue( info.metaretArr, info.origBody, nameArr, against )
                                                     , info.varArr
                                                     , undefName
                                                 )
                                               )
                             ) 
                         );
                
                code.push( 'break;' );
                code.push( '' );
                return code.map( i8 ).join( '\n' );
            }
        }

    }  // end of function _createSolver

    // ---------- Private implementation: deeper

    function _checkName(/*string*/name)
    {
        if (!_RX_NAME.test( name ))  
            throw new Error('MetaFunction : _checkName : Invalid function name "' + name + '". The function name must match [a-zA-Z_][a-zA-Z_0-9]*');

        if (name in _name2info)
            throw new Error('MetaFunction : _checkName : Duplicate function name "' + name + '". The function name must be unique: ' + 
                            'MetaFunction can be called one time only with a given name.' 
                           );
    }

    function _checkExtractParam( /*string*/param )  
    {
        if (!_RX_PARAM.test( param ))
            throw new Error('MetaFunction : _checkExtractParam : Invalid parameters string, the string must be like "#x,#self,#y,#z".')

        var ret = param.replace(/\s+/g, '' ).split( ',' );
        ret.self = ret.splice( ACTION_PARAM, 1 )[ 0 ];
        return ret;
    }

    function _extractVar( /*string*/body )
    {
        var rx = new RegExp( _RE_VAR, 'g' )
        , m_arr
        , ret = []
        ;
        while (m_arr = rx.exec( body ))
        {
            var text = m_arr[1];
            ret.push( { text    : text
                        , end   : rx.lastIndex + 1
                        , start : rx.lastIndex + 1 - m_arr[ 0 ].length
                      }
                    );
            
        }
        return ret;
    }

    function _checkExtractMetaret( /*string*/body, /*string*/self, /*string*/selfName )
    {
        var rx = new RegExp( _RE_METARET, 'g' )
        , m_arr
        , ret  = []
        ;

        // Remember

        ret.body     = body;
        ret.self     = self;
        ret.selfName = selfName;

        // Parse

        while (m_arr = rx.exec( body ))
        {
            var exprArr = m_arr[1].split( ',,' )
            , n         = exprArr.length
            ;
            for (var i = n ; i-- ; ) 
                exprArr[ i ] = exprArr[ i ].replace( /^\s+/, '' ).replace( /\s+$/, '' );
            
            var action = n > 1  &&  exprArr.splice( ACTION_PARAM, 1 )[ 0 ];
            if (!action)
                throw new Error('MetaFunction : _checkExtractMetaret() : A `#metaret` needs at least an action.');
            
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
                        , end    : rx.lastIndex + 1
                        , start  : rx.lastIndex + 1 - m_arr[ 0 ].length
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

    function hasAll(/*?object?*/visited, /*?array of string?*/visitedArr)
    {
        // Returns  false | array of strings
     
        var topLevel = !arguments.length;
        if (topLevel)
        {
            var cache = 'hasAllResult';
            if (cache in this)  
                return this[ cache ];
        }

        // Do the (possibly recursive) search
        
        visited     ||  (visited = {});
        visitedArr  ||  (visitedArr = []);

        for (var i = this.length; i--; )
        {
            var x = this[ i ];
            if (x.isSelf)
                continue;

            var action = x.action;
            if (!action)
                throw new Error('MetaFunction : hasAll : Found a bug: empty metaret action (not permitted).');

            if (action in visited)  // Prevent infinite cycles
                continue;

            if (!(action in _name2info))
                return false;       // Failure

            visited[ action ] = 1;
            visitedArr.push( action );

            if (!_name2info[ action ].metaretArr.hasAll( visited, visitedArr ))
                return false;       // Failure
        }

        if (topLevel)
            return this[ cache ] = visitedArr;   // Success
        else
            return visitedArr;   // Not finished yet
    }
    

    function _checkRemoveHash( /*array of object or string, each starting with #*/hashArr, /*?string | array of string?*/body_or_arr ) 
    {
        // maps:  array -> array  or:   string -> string

        if (body_or_arr == null)
            body_or_arr = hashArr;

        if (typeof body_or_arr !== 'string')
            return body_or_arr.map( function (s) { return _checkRemoveHash( hashArr, s ); } );
        
        // string

        var newBody = body_or_arr;

        hashArr.forEach( update_newBody );

        return newBody;

        function update_newBody( /*object | string*/hash )
        {
            if (typeof hash === 'object')
                hash = hash.text;

            if (hash.charAt( 0 ) !== '#')
                throw new Error( 'MetaFunction : _checkRemoveHash : Invalid hash string "' + hash + '". It must at least start with a hash.' );
            
            newBody = newBody.replace( new RegExp( hash, 'g' ), hash.slice( 1 ) );  // Drop the hash at the beginning
        }
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
            var label = '_' + baseName + (i || '') + '_';
            
            if (!match( against ))
                return label;  // success
            
            // failure
        }

        function match( /*array | string*/against )
        {
            if (typeof against === 'string')
                return -1 < against.indexOf( label )  ||  -1 < against.indexOf( '#' + label );

            // array -> recurse (OR logic)

            for (var i = against.length; i--; )
            {
                if (match( against[ i ] ))
                    return true;
            }

            return false;
        }
    }

    function _replaceMetaretWithContinue( metaretArr, origBody, /*string | array of string*/label_or_nameArr /*, ... recursive array of strings: string | array of ( string | array ...) ... */ )
    {
        var against = _Aps.call( arguments, 1 )  // Including `origBody`, `label` and `newVarArr`
        , isLabel   = typeof label_or_nameArr === 'string'
        , ret       = origBody
        ;
        for (var i = metaretArr.length; i--; )   // Downward order important
        {
            var metaret = metaretArr[ i ]
            , code      = prepareCode( metaret )
            ;
            ret = ret.slice( 0, metaret.start ) + code + ret.slice( metaret.end );
        }
        
        return ret;

        function prepareCode( metaret )
        {
            var code   = []
            , info     = _name2info[ metaret.action ]
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
                for (var i = 0, end = paramArr.length; i < end; i++)
                {
                    var varname  = paramArr[ i ]
                    , newVarname = _generateName( varname.slice( 1 ), against )   // slice( 1 ): remove '#' right away
                    ;
                    against.push( newVarname );  // Prevent future collisions on this new name
                    
                    code.splice( i, 0, 'var ' + newVarname + ' = ' + exprArr[ i ] + ';' );
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
                    code.push( 'continue ' + nameArr.switchLabel + '; /* stay in: ' + metaret.action + ' */' );
                }
                else
                {
                    // Moving to the body of another metafunction (switch style)
                    var switch_ind = nameArr.indexOf( metaret.action );
                    if (0 > switch_ind)
                    {
                        throw new Error('MetaFunction : _replaceMetaretWithContinue : prepareCode : Found a bug! Could not find the switch index of action "' +
                                        metaret.action + '"' 
                                       );
                    }
                    
                    code.push( nameArr.switch_ind_name + ' = ' + switch_ind + '; /* go to: ' + metaret.action + ' */' );
                    code.push( 'continue ' + nameArr.switchLabel + ';' );
                }
            }   
            
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
            
            if (-1 < maybeDeclInd  &&  maybeDeclInd < v.end)
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

})(this);
