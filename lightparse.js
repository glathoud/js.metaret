(function (global)
 {
     var RETURN = 'return'
     ,   VAR    = 'var'
     ,   RESERVED_ARR = [     // ECMAScript 5, Section 7.6
         
         "break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof"
         , "new", RETURN, "switch", "this", "throw", "try", "typeof", VAR, "void", "while", "with"
         
         , "class", "const", "enum", "export", "extends", "import", "super"
         
         , "implements", "interface", "let", "package", "private", "protected", "public", "static", "yield"
     ]
     , EXTRA_BRACKET_ARR = [
         { open : RETURN, close : ';', typebracket : RETURN, ignore_unbalanced : true }
         , { open : VAR,  close : [ ';', 'in' ], typebracket : VAR, ignore_unbalanced : true }
     ]
     ;
     
     global.lightparse = lightparse;
     
     lightparse.getDefaultReservedArr = getDefaultReservedArr; 

     // --- Implementation
     
     function getDefaultReservedArr() { return [].concat( RESERVED_ARR ); }

     // In the implementation of `lightparse`, the small comments
     // /*sc*/, /**/ etc. delimitate beginnings and ends of strings,
     // comments and regexps, for unit testing: ./lightparse_test.js

     function lightparse( /*sc*//*string*//**/code, /*sc*//*?object?*//**/opt )
     /*{0*/{
         var /*vd*/reservedArr/**/ = ((opt  &&  opt.reservedArr)  ||  RESERVED_ARR).concat( (opt  &&  opt.extraReservedArr)  ||  [] )
         ,   /*vd*/extraBracketArr/**/ = EXTRA_BRACKET_ARR.concat( (opt  &&  opt.extraBracketArr)  ||  [] )
         ,   /*vd*/ret/**/ = /*{1*/{
             strArr : []
             , commentArr  : []
             , regexpArr   : []

             , reservedArr       : []
             , reservedObj       : /*{1.1*/{}/*}1.1*/

             , callArr           : []
             , dotArr            : []
             , dotcallArr        : []
             , identifierArr     : []

             /*dc*/// The last three are derived from `identifierArr`, for convenience.
             , identifierArrReverse : []
             , identifierObj        : /*{1.2*/{}/*}1.2*/
             , identifierObjReverse : /*{1.3*/{}/*}1.3*/

	     /*dc*/// Derived from callArr, for convenience
	     , callObj              : /*{1.4*/{}/*}1.4*/
             
             /*dc*/// Bracket pairs
             , bracketcurlyArr          : []
             , bracketroundArr          : []
             , bracketsquareArr         : []
             , bracketextraArr          : []

             /*dc*/// Brackets: derived values
             , bracketArr               : []
             , bracketTree              : []

         }/*}1*/
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
         /*{2*/{
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
             /*{2.1*/{
                 var /*vd*/v/**/ = four[ i ];
                 if (-1 < v  &&  v < begin)
                 /*{2.1.1*/{
                     begin = v;
                     ind   = i;
                 }/*}2.1.1*/
             }/*}2.1*/

             if (ind < 0)
             /*{2.2*/{
                 /*dc*/// Not found

                 nakedCodeArr.push( code.substring( searchPosition ) );
                 break;
             }/*}2.2*/

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

             (ind < 2  ?  sA  :  ind < 4  ?  cA  :  rxA).push( /*{2.3*/{ begin : begin,  str : code.substring( begin, end ) }/*}2.3*/ );

             /*dc*/// Prepare for identifier search

             nakedCodeArr.push(
                 code.substring( searchPosition, begin )
                 , str_repli( /*sq*/' '/**/, delta )
             );

             /*dc*/// Prepare for the next search

             searchPosition = end;

         }/*}2*/
         
         /*dc*/// Detect identifiers and reserved words
         
         var /*vd*/reservedSet/**/ = /*{2a*/{}/*}2a*/;
         for (var /*vd*/i/**/ = reservedArr.length; i--;)  
             reservedSet[ reservedArr[ i ] ] = 1;
         
         var /*vd*/resA/**/      = ret.reservedArr
         ,   /*vd*/caA/**/       = ret.callArr
         ,   /*vd*/dA/**/        = ret.dotArr
         ,   /*vd*/dcaA/**/      = ret.dotcallArr
         ,   /*vd*/iA/**/        = ret.identifierArr
         ,   /*vd*/nakedCode/**/ = nakedCodeArr.join( /*sq*/''/**/ )
         ,   /*vd*/rx/**/        = /*rr*//(\.\s*)?(\b[_a-zA-Z]\w*\b)(\s*\()?/g/**/
         
         ,   /*vd*/mo/**/
         ;
         while (mo = rx.exec( nakedCode ))
         /*{3*/{
             var  /*vd*/str/**/ = mo[ 0 ]
             ,    /*vd*/dot/**/ = mo[ 1 ]
             ,   /*vd*/name/**/ = mo[ 2 ]
             ,   /*vd*/call/**/ = mo[ 3 ]
             ,   /*vd*/arr/**/  = (
                 name in reservedSet  ?  resA  
                     : dot && call    ?  dcaA
                     : dot            ?    dA
                     : call           ?   caA
                     :                     iA
             )
             ,   /*vd*/begin/**/ = mo.index
             ,   /*vd*/x/**/     = /*{3.a1*/{ str : str,  begin : begin , name : name }/*}3.a1*/ 
             ;             
             arr.push( x );

         }/*}3*/
         
         
         /*dc*/// Curly brackets (blocks of code or objects).
         
         /*dc*/// - First, white out each regexp.
         var /*vd*/nakedCodeNoRx/**/ = nakedCode;
         for (var /*vd*/i/**/ = rxA.length; i--;)
         /*{6*/{
             var /*vd*/x/**/ = rxA[ i ]
             , /*vd*/len/**/ = x.str.length
             ;
             nakedCodeNoRx = nakedCodeNoRx.substring( 0, x.begin ) + 
                 str_repli( /*sq*/' '/**/, len ) + 
                 nakedCodeNoRx.substring( x.begin + len )
             ;
         }/*}6*/
         
         /*dc*/// - Second, find bracket pairs.

         var /*vd*/bcA/**/ = ret.bracketcurlyArr
         ,   /*vd*/brA/**/ = ret.bracketroundArr
         ,   /*vd*/bsA/**/ = ret.bracketsquareArr
         ,   /*vd*/beA/**/ = ret.bracketextraArr

         ,    /*vd*/bA/**/ = ret.bracketArr

         , /*vd*/find_bracket_cfg/**/ = [
             /*{7a*/{
                 out_arr : bcA
                 , open  : /*sq*/'{'/**/
                 , close : /*sq*/'}'/**/
                 , typebracket  : /*sq*/'curly'/**/
             }/*}7a*/
             , /*{7b*/{
                 out_arr : brA
                 , open  : /*sq*/'('/**/
                 , close : /*sq*/')'/**/
                 , typebracket  : /*sq*/'round'/**/
             }/*}7b*/
             , /*{7c*/{
                 out_arr : bsA
                 , open  : /*sq*/'['/**/
                 , close : /*sq*/']'/**/
                 , typebracket  : /*sq*/'square'/**/
             }/*}7c*/
         ].concat( extraBracketArr.map( function (x) /*{7d*/{
             
             var /*vd*/ret/**/ = Object.create( x ); 
             ret.out_arr = beA; 
             return ret; 
             
         }/*}7d*/ ) )
         ;
         
         find_bracket( find_bracket_cfg, nakedCodeNoRx, code, bA );
                 
         build_bracket_tree( bA, ret.bracketTree );
         build_bracket_sep_split( bA, nakedCodeNoRx, code, reservedArr );
         build_bracket_var_leftstr_rightstr( bA, cA );

         /*dc*/// Mark which identifier instances are var declarations.
         
         var /*vd*/tmp/**/ = bA
             .filter( function (x) /*{c8*/{ return x.typebracket === VAR; }/*}c8*/ )
             .reduce( function (a,b) /*{b8*/{ return a.concat( b.sepSplit ); }/*}b8*/
                      , [] 
                    )
         ;
         for (var /*vd*/iA_i/**/ = 0
              , /*vd*/n/**/ = tmp.length
              , /*vd*/niA/**/ = iA.length
              , /*vd*/i/**/ = 0; i < n  &&  iA_i < niA ; i++)
         /*{a8*/{
             var /*vd*/x/**/ = tmp[ i ]
             ,  /*vd*/id/**/
             ;
             while ((id = iA[ iA_i ]).begin < x.begin)
             /*{a8.1*/{
                 id.isVardecl = false;
                 iA_i++;
             }/*}a8.1*/
             id.isVardecl = true;
             iA_i++;
         }/*}a8*/
         

         /*dc*/// Identifiers: a few derived values, for convenience

         var /*vd*/iA/**/ = ret.identifierArr
         ,   /*vd*/iR/**/ = ret.identifierArrReverse = reversed( iA )
         ,  /*vd*/vdA/**/ = ret.vardeclArr = []
         
         ,   /*vd*/iO/**/  = ret.identifierObj = /*{3a*/{}/*}3a*/
         ;
         for (var /*vd*/n/**/ = iA.length, /*vd*/i/**/ = 0; i < n; i++)
         /*{4*/{
             var /*vd*/x/**/ = iA[ i ];
             (
                 iO[ x.str ]  ||  (iO[ x.str ] = [])
             )
                 .push( x.begin )
             ;

             if (x.isVardecl)
                 vdA.push( x );
         }/*}4*/
         
	 var /*vd*/cA/**/ = ret.callArr
	     ,  /*vd*/cO/**/ = ret.callObj = /*{4b*/{}/*}4b*/
	 ;
	 for (var /*vd*/n/**/ = cA.length, /*vd*/i/**/=0; i <n; i++)
	     /*{4c*/{
	     var /*vd*/x/**/ = cA[ i ];
	     (
	      cO[ x.name ]  ||  (cO[ x.name ] = [])
	      )
		 .push( x.begin )
		 ;
	 }/*}4c*/

         var /*vd*/iOR/**/ = ret.identifierObjReverse = /*{a5*/{}/*}a5*/;
         for (var /*vd*/str/**/ in iO) /*{5*/{ if (!(str in iOR)) /*{5.1*/{

             iOR[ str ] = reversed( iO[ str ] );
             
         }/*}5.1*/}/*}5*/


         /*dc*/// Reserved words: a few derived values, for convenience
         var /*vd*/rA/**/ = ret.reservedArr
         ,   /*vd*/rO/**/ = ret.reservedObj
         ;
         for (var /*vd*/n/**/ = rA.length, /*vd*/i/**/ = 0; i < n ; i++)
         /*{6a*/{
             var /*vd*/x/**/ = rA[ i ];
             (
                 rO[ x.name ]  ||  (rO[ x.name ] = [])
             )
                 .push( x.begin );
         }/*}6a*/
                  

         /*dc*/// All elements, in both first-to-last and reverse orders.
         /*dc*/// Also add a `type` field to each element.

         var /*vd*/all/**/ = ret.all = [];
         
         for (var /*vd*/k/**/ in ret) /*{8*/{
             
             var /*vd*/mo/**/ = k.match( /*rr*//^(.+)Arr$//**/ );
             if (mo)
             /*{8.1*/{
                 var /*vd*/arr/**/ = ret[ k ]
                 ,  /*vd*/type/**/ = mo[ 1 ]
                 ;
                 for (var /*vd*/i/**/ = arr.length; i--;)
                     arr[ i ].type = type;

                 all.push.apply( all, arr );                 
             }/*}8.1*/
         }/*}8*/
       
         /*dc*/// Guarantee all have "end", guarantee unicity
         for (var /*vd*/i/**/ = all.length; i--;)
         /*{9*/{
             var /*vd*/xi/**/ = all[ i ];
             if (!(/*sq*/'end'/**/ in xi))
                 xi.end = xi.begin + xi.str.length;
         }/*}9*/

         all.sort( compare_begin_end ); /*dc*/// This sort prepares to build a tree
         
         /*dc*/// Guarantee unicity
         for (var /*vd*/i/**/ = all.length; --i;)
         /*{10*/{
             var /*vd*/xi/**/ = all[ i ]
             , /*vd*/xim1/**/ = all[ i - 1 ]
             ;
             if (xi.begin === xim1.begin  &&  xi.end === xim1.end)
             /*{10.1*/{
                 if (xi.type !== xim1.type) /*dc*/// Sanity check
                     throw new Error( /*dq*/"Internal bug."/**/ );
                 all.splice( i, 1 );
             }/*}10.1*/
         }/*}10*/

         ret.allReverse = reversed( all );

         /*dc*/// Build a tree
         var /*vd*/allTree/**/ = [].concat( all );

         for (var /*vd*/i/**/ = allTree.length - 1; i--; )
         /*{11*/{
             var /*vd*/xi/**/ = allTree[ i ]
             ,   /*vd*/xip1/**/
             ;
             while (xip1 = allTree[ i + 1 ]
                    , xip1  &&  
                    xi.begin <= xip1.begin  &&  xip1.end <= xi.end
                   )
             /*{11.1*/{
                 (xi.children  ||  (xi.children = []))
                     .push( allTree.splice( i+1, 1 )[ 0 ] )
                 ;
             }/*}11.1*/
         }/*}11*/
             
         ret.allTree = allTree;
         
         return ret;
             
     }/*}0*/

     // --- Detail

     function compare_begin (a,b) { return a.begin < b.begin  ?  -1  :  +1; }

     function compare_begin_end (a,b) { return a.begin < b.begin  ?  -1  :  a.begin > b.begin  ?  +1  :  a.end > b.end  ?  -1  :  +1; }

     function build_bracket_tree( /*array*/inArr, /*array*/outTree )
     {
         var pile = [];
         for (var n = inArr.length, i = 0; i < n; i++)
         {
             var x = inArr[ i ];
             x.bracketchildren = [];

             // Close
             
             var last;
             while ((last = pile[ pile.length - 1])  &&  last.end < x.begin)
                 pile.pop();
             
             // Append

             x.bracketparent   = last  ?  last  :  null;
             x.bracketdepth    = pile.length;
             
             if (last  &&  x.begin < last.end)
                 last.bracketchildren.push( x );

             else
                 outTree.push( x );
             
             // Open

             pile.push( x );
         }
     }


     function build_bracket_sep_split( /*array*/bA, /*string*/nakedCodeNoRx, /*string*/code, /*array of string*/reservedArr )
     {
         for (var i = bA.length; i--;)
         {
             var      x = bA[ i ]
             ,     kids = x.bracketchildren
             , nakedOne = nakedCodeNoRx.substring( x.begin, x.end )
             ,   offset = x.begin;
             ;
             // Whitespace open and close
             nakedOne = str_repli( ' ', x.open.length ) + 
                 nakedOne.substring( x.open.length, nakedOne.length - x.close.length ) + 
                 str_repli( ' ', x.close.length )
             ;

             // Whitespace all brackedchildren
             for (var j = kids.length; j--;)
             {
                 var  kid = kids[ j ];
                 nakedOne = nakedOne.substring( 0, kid.begin - offset ) + 
                     str_repli( ' ', kid.end - kid.begin ) 
                     + nakedOne.substring( kid.end - offset )
                 ;
             }
             // Now we can look for comma/semicolon splits without risking to
             // match any comma/semicolon within a kid.

             var rx = new RegExp(
                 [ ',', ';' ]
                     .concat( reservedArr.map( function (w) { return '\\b' + w + '\\b' } ) )
                     .join( '|' )
                 , 'g' 
             )
             ,   sA = x.sepArr = []
             ,   mo
             ;
             while (mo = rx.exec( nakedOne ))
                 sA.push( { index : offset + mo.index, type : mo[ 0 ] } );

             var FIRST = '<first>'
             ,   LAST  = '<last>'
             ,   arr = [ { index : offset + x.open.length, type : FIRST } ]
                 .concat( sA )
                 .concat( [ { index : offset + nakedOne.length - x.close.length, type : LAST } ] )
             ,   sS  = x.sepSplit = []
             ;
             for (var n = -1 + arr.length, j = 0; j < n; j++)
             {
                 var before = arr[ j ]
                 ,   after  = arr[ j + 1 ]
                 ,   begin  = before.index + (before.type !== FIRST  &&  before.type !== LAST  ?  before.type.length  :  0)
                 ,   end    = after .index
                 ,   str    = code.substring( begin, end )
                 ;
                 if (!str)
                     continue;
                 
                 sS.push( { 
                     begin : begin
                     , end : end
                     , str : str
                     , sep_begin : before
                     , sep_end   : after
                 } );
             }
             
         }
     }

     function build_bracket_var_leftstr_rightstr( bA, commentArr )
     {
         for (var i = bA.length; i--;)
         {
             var brack = bA[ i ];
             if (brack.typebracket !== VAR)
                 continue;
             
             var vdArr = brack.vdArr = [];
             
             var s_arr = brack.sepSplit;
             for (var nj = s_arr.length, j = 0; j < nj; j++)
             {
                 var s = s_arr[ j ]
                 , str = (
                         /\/\*|\*\//.test( s.str )  ?  removeComments( s ) : s.str
                 )
                     .replace( /^\s*|\s*$/g, '' )
                 , mo_LR = str.match( /^([^=]*)\s*=\s*([\s\S]+)$/ )
                 ;
                 vdArr.push(
                     mo_LR ?  { leftstr : mo_LR[ 1 ]
                                , rightstr : mo_LR[ 2 ]
                              }
                     : { leftstr : str, rightstr : null }
                 );
             }
         }

         function removeComments( s )
         {
             var str = s.str
             , begin = s.begin
             ,   end = s.end
             ;
             for (var i = commentArr.length; i--;)
             {
                 var c = commentArr[ i ];
                 if (c.end > end)
                     continue;

                 if (c.end < begin)
                     break;

                 str = str.substring( 0, c.begin - begin )
                     + str.substring( c.end - begin );
             }
             return str;
         }
     }


     function find_bracket( /*array*/cfgA, /*string*/nakedCodeNoRx, /*string*/code, /*array*/bA )
     {
         // First, find all open & close occurences, in a single pass
         // to keep the order they appear in `nakedCodeNoRx`.
         
         var rx = new RegExp(
             cfgA.map( function (o) { 
                 var open  = fix( o.open )
                 ,   close = fix( o.close )
                 ;
                 return '(' + open + ')' + 
                     '|' + 
                     '(' + close + ')'
                 ; 

                 function fix( x )
                 {
                     return 'string' === typeof x  ?  x.replace( /(\W)/g, '\\$1' ).replace( /^(\w)/, '\\b$1' ).replace( /(\w)$/, '$1\\b' )
                         : x.map( fix ).join( '|' )  // For a bracket with multiple possibilities e.g. var...; or var...in
                     ;
                 }
             } )
                 .join( '|' )
             , 'g'
         )
         ,   arr = []
         ,   mo
         ,   error
         ;
         while (mo = rx.exec( nakedCodeNoRx ))
         {
             var ind2 = -1;
             for (var i = mo.length; i--;)
             {
                 if (mo[ i ])
                 {
                     ind2 = i-1;
                     break;
                 }
             }
             
             if (!(-1 < ind2))
                 error.bug;  // Sanity check
             
             var is_close = 1 & ind2
             ,   cfgA_ind = ind2 >> 1
             ;
             
             var sanity = cfgA[ cfgA_ind ][ is_close  ?  'close'  :  'open' ];
             if (!('string' === typeof sanity  ?  mo[0] === sanity  :  -1 < sanity.indexOf( mo[ 0 ] )))
                 error.bug;  // Sanity check
             
             var one = {
                 begin : mo.index
                 , end : mo.index + mo[ 0 ].length
                 , cfg : cfgA[ cfgA_ind ]
             };

             one[ is_close  ?  'close'  :  'open' ] = mo[ 0 ];

             arr.push( one );
         }

         // Second, walk through open/close instances and pair them,
         // using a pile to take care of encapsulation
         //
         // Store (1) into the array specific to each `typebracket`
         // and (2) into the global array of all brackets: `bA`.
         //
         // Here too, we do a single pass to preserve order.

         var pile = [];
         for (var n = arr.length, i = 0; i < n; i++)
         {
             var one = arr[ i ];

             if (i === 297)
                 'xxx';

             if (one.open)
             {
                 var x = { begin         : one.begin
                           , typebracket : one.cfg.typebracket
                           , open        : one.cfg.open
                           , close       : one.cfg.close 
                         };
                 one.cfg.out_arr.push( x ); // Specific to this typebracket.
                 bA             .push( x ); // All types together, in order.

                 pile           .push( { i : i, x : x } ); // Used below to close.
             }
             else
             {
                 var last = pile[ pile.length - 1 ];
                 if (!last)
                 {
                     if (!one.cfg.ignore_unbalanced)
                         throw new Error( 'Unbalanced brackets: missing an opening "' + one.cfg.open + '".' );
                 }
                 else if ('string' === typeof last.x.close  ?  last.x.close !== one.close  :  0 > last.x.close.indexOf( one.close ))
                 {
                     if (!(arr[ last.i ].cfg.ignore_unbalanced  ||  one.cfg.ignore_unbalanced))
                     {
                         throw new Error( 
                             'Unbalanced brackets: opening typebracket "' + last.x.typebracket + '" (' + last.x.begin + ')' + 
                                 ' does not match closing typebracket "' + one.cfg.typebracket + '" (' + one.begin + ').' 
                         );
                     }
                 }
                 else
                 {                 
                     var   x = pile.pop().x;
                     x.close = one.close;
                     x.end   = one.end;
                     x.str   = code.substring( x.begin, x.end );
                 }
             }
         }
         
         if (pile.length !== 0)
             throw new Error( 'Unbalanced brackets: missing a closing "' + pile[ pile.length - 1 ].x.close + '".' );
     }
          

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
