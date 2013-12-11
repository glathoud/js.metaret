(function (global)
 {
     var RESERVED_ARR = [     // ECMAScript 5, Section 7.6
         
         "break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof"
         , "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with"
         
         , "class", "const", "enum", "export", "extends", "import", "super"
         
         , "implements", "interface", "let", "package", "private", "protected", "public", "static", "yield"
     ];
     
     global.lightparse = lightparse;
     
     lightparse.getDefaultReservedArr = getDefaultReservedArr; 

     // --- Implementation
     
     function getDefaultReservedArr() { return [].concat( RESERVED_ARR ); }

     // In the implementation of `lightparse`, the small comments
     // /*sc*/, /**/ etc. delimitate beginnings and ends of strings,
     // comments and regexps, for unit testing: ./lightparse_test.js

     function lightparse( /*sc*//*string*//**/code, /*sc*//*?object?*//**/opt )
     {
         var /*vd*/reservedArr/**/ = ((opt  &&  opt.reservedArr)  ||  RESERVED_ARR).concat( (opt  &&  opt.extraReservedArr)  ||  [] )
         ,   /*vd*/ret/**/ = {
             strArr : []
             , commentArr  : []
             , regexpArr   : []
             , reservedArr       : []
             , callArr           : []
             , dotArr            : []
             , dotcallArr        : []
             , identifierArr     : []

             /*dc*/// The last three are derived from `identifierArr`, for convenience.
             , identifierArrReverse : []
             , identifierObj        : {}
             , identifierObjReverse : {}
         }
         ;

         /*dc*/// Detect comments and strings, and produce a "nakedCode"
         /*dc*/// string where they've all been replaced with spaces.

         var /*vd*/sA/**/ = ret.strArr
         ,   /*vd*/cA/**/ = ret.commentArr
         ,  /*vd*/rxA/**/ = ret.regexpArr
         , /*vd*/nakedCodeArr/**/   = []
         , /*vd*/searchPosition/**/ = 0
         ;
         while (true)
         {
             /*dc*/// Search for a string or comment, whichever comes first

             var /*vd*/sq/**/ = code.indexOf( /*dq*/"'"/**/ , searchPosition )
             ,   /*vd*/dq/**/ = code.indexOf( /*sq*/'"'/**/ , searchPosition )
             ,   /*vd*/sc/**/ = code.indexOf( /*sq*/'/*'/**/, searchPosition )
             ,   /*vd*/dc/**/ = code.indexOf( /*sq*/'//'/**/, searchPosition )
             ,   /*vd*/rr/**/ = code.indexOf( /*sq*/'/'/**/,  searchPosition )

             ,   /*vd*/four/**/ = [ sq, dq, sc, dc, rr ]
             ,   /*vd*/begin/**/ = +Infinity
             ,   /*vd*/ind/**/  = -1
             ;
             for (var /*vd*/n/**/ = four.length, /*vd*/i/**/ = 0; i < n; i++)
             {
                 var /*vd*/v/**/ = four[ i ];
                 if (-1 < v  &&  v < begin)
                 {
                     begin = v;
                     ind   = i;
                 }
             }

             if (ind < 0)
             {
                 /*dc*/// Not found

                 nakedCodeArr.push( code.substring( searchPosition ) );
                 break;
             }

             /*dc*/// Found: find its end

             var /*vd*/rest/**/  = code.substring( begin )

             , /*vd*/rx/**/ =   ind === 0  ?  /*rr*//^[\s\S]*?[^\\]\'//**/
                 :    ind === 1  ?  /*rr*//^[\s\S]*?[^\\]\"//**/
                 :    ind === 2  ?  /*rr*//^\/\*[\s\S]*?\*\///**/
                 :    ind === 3  ?  /*rr*//^\/\/([^\r\n])*//**/
                 :                  /*rr*//^\/.*?[^\\]\/[gmi]?//**/

             , /*vd*/mo/**/    = rx.exec( rest )
             , /*vd*/delta/**/ = mo  ?  mo.index + mo[ 0 ].length  :  rest.length
             , /*vd*/end/**/   = begin + delta
             ;
             
             /*dc*/// Store

             (ind < 2  ?  sA  :  ind < 4  ?  cA  :  rxA).push( { begin : begin,  str : code.substring( begin, end ) } );

             /*dc*/// Prepare for identifier search

             nakedCodeArr.push(
                 code.substring( searchPosition, begin )
                 , str_repli( /*sq*/' '/**/, delta )
             );

             /*dc*/// Prepare for the next search

             searchPosition = end;

         }
         
         /*dc*/// Detect identifiers and reserved words
         
         var /*vd*/reservedObj/**/ = {};
         for (var /*vd*/i/**/ = reservedArr.length; i--;)  
             reservedObj[ reservedArr[ i ] ] = 1;
         
         var /*vd*/resA/**/      = ret.reservedArr
         ,   /*vd*/caA/**/       = ret.callArr
         ,   /*vd*/dA/**/        = ret.dotArr
         ,   /*vd*/dcaA/**/      = ret.dotcallArr
         ,   /*vd*/iA/**/        = ret.identifierArr
         ,   /*vd*/nakedCode/**/ = nakedCodeArr.join( /*sq*/''/**/ )
         ,   /*vd*/rx/**/        = /*rr*//(\.\s*)?(\b[_a-zA-Z]\w*\b)(\s*\()?/g/**/

         /*dc*/// rx_varDecl_*: Good but not 100% sure -> xxx at some
         /*dc*/// point we need to parse a bit more the var
         /*dc*/// statements. In particular, this RegExp "solution"
         /*dc*/// requires to close var with a ";".
         ,   /*vd*/rx_varDecl_before/**/ = /*rr*//\bvar[\s\r\n]+([^;]*,\s*)?$//**/
         ,   /*vd*/rx_varDecl_after/**/  = /*rr*//^\s*(=[^=]|,|;)//**/
         ,   /*vd*/rx_notVarDecl_after/**/ = /*rr*//^[^=;]*[\)\}\]]//**/
         
         ,   /*vd*/rx_forIn_before/**/  = /*rr*//for\s*\(\s*var\s+$//**/
         ,   /*vd*/rx_forIn_after/**/   = /*rr*//^\s+in\s+//**/

         ,   /*vd*/mo/**/
         ;
         while ( mo = rx.exec( nakedCode ) )
         {
             var  /*vd*/str/**/ = mo[ 0 ]
             ,    /*vd*/dot/**/ = mo[ 1 ]
             ,   /*vd*/name/**/ = mo[ 2 ]
             ,   /*vd*/call/**/ = mo[ 3 ]
             ,   /*vd*/arr/**/  = (
                 name in reservedObj  ?  resA  
                     : dot && call    ?  dcaA
                     : dot            ?    dA
                     : call           ?   caA
                     :                     iA
             )
             ,   /*vd*/begin/**/ = mo.index
             ,   /*vd*/x/**/     = { str : str,  begin : begin , name : name } 
             ;
             if (arr === iA)
             {
                 var /*vd*/codeBefore/**/ = nakedCode.substring( 0, begin )
                 ,   /*vd*/codeAfter/**/  = nakedCode.substring( begin + name.length )
                 ;
                 
                 x.isVardecl = (
                     rx_varDecl_after.test( codeAfter )  &&  
                         !rx_notVarDecl_after.test( codeAfter )  &&  
                         rx_varDecl_before.test( codeBefore )
                 )  ||  (
                     rx_forIn_before.test( codeBefore )  &&  
                      rx_forIn_after.test( codeAfter )
                 );
             }
             
             arr.push( x );

         }
         
         /*dc*/// Identifiers: a few derived values, for convenience

         var /*vd*/iA/**/ = ret.identifierArr
         ,   /*vd*/iR/**/ = ret.identifierArrReverse = reversed( iA )
         ,  /*vd*/vdA/**/ = ret.vardeclArr = []
         
         ,   /*vd*/iO/**/  = ret.identifierObj = {}
         ;
         for (var /*vd*/n/**/ = iA.length, /*vd*/i/**/ = 0; i < n; i++)
         {
             var /*vd*/x/**/ = iA[ i ];
             (
                 iO[ x.str ]  ||  (iO[ x.str ] = [])
             )
                 .push( x.begin )
             ;

             if (x.isVardecl)
                 vdA.push( x );
         }
         
         var /*vd*/iOR/**/ = ret.identifierObjReverse = {};
         for (var /*vd*/str/**/ in iO) { if (!(str in iOR)) {

             iOR[ str ] = reversed( iO[ str ] );
             
         }}
         
         
         /*dc*/// All elements, in both first-to-last and reverse orders.
         /*dc*/// Also add a `type` field to each element.

         var /*vd*/all/**/ = ret.all = [];
         
         for (var /*vd*/k/**/ in ret) {
             
             var /*vd*/mo/**/ = k.match( /*rr*//^(.+)Arr$//**/ );
             if (mo)
             {
                 var /*vd*/arr/**/ = ret[ k ]
                 ,  /*vd*/type/**/ = mo[ 1 ]
                 ;
                 for (var /*vd*/i/**/ = arr.length; i--;)
                     arr[ i ].type = type;

                 all.push.apply( all, arr );                 
             }
         }
       
         all.sort( function (a,b) { return a.begin < b.begin  ?  -1  :  +1; } )
         
         ret.allReverse = reversed( all );
         
         return ret;
     }

     // --- Detail

     function reversed( arr )
     {
         var ret = [].concat( arr );
         ret.reverse();
         return ret;
     }


     function str_repli(/*string*/s, /*positive number*/n) 
     {
         return str_filler(s, n)();
     }


     function str_trim(/*string*/s) 
     {
         return s.replace(/(^\s*|\s*$)/g, '');
     }
     
     function str_filler(/*?string?*/f, /*number, negative to fill on the left, positive to fill on the right*/n) 
     {
         
         if (typeof f === 'number') {
             n = f;
             f = null;
         }

         f = f || ' ';

         var target = Math.abs( n ) * f.length;

         return function (/*string*/s) {

             s = s || '';

             s = s + ''; // Force conversion to string

             var remaining = Math.max( 0, target - s.length )
             ,   tmp = f
             ,   fill = []
             ;

             for (var p = Math.floor( remaining / f.length ) + (((remaining % f.length) > 0) ? 1 : 0);
                  p > 0;
                  tmp += tmp, p >>= 1) {
                 
                 if (p && 1)
                     fill.push( tmp );
             }
             
             fill = fill.join( '' );

             if (fill.length > remaining)
                 fill = (n < 0) ? fill.substring( fill.length - remaining ) : fill.substring( 0, remaining );
             
             if (fill.length !== remaining)
                 throw new Error( 'str.filler() is buggy!' );

             return (n < 0) ? (fill + s) : (s + fill);
         };
     }

})(this);
