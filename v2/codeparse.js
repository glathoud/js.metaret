/*global acorn need$ load*/

if (typeof acorn === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "acorn.25.03.2014/acorn.js" );

if (typeof acorn.walk === 'undefined')
    (typeof need$ !== 'undefined'  ?  need$  :  load)( "acorn.25.03.2014/util/walk.js" );


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
	 , _emptyObj = {}
     ;
     
     global.codeparse = codeparse;
     
     codeparse.getDefaultReservedArr = getDefaultReservedArr; 

     // --- Implementation
     
     function getDefaultReservedArr() { return [].concat( RESERVED_ARR ); }

     // In the implementation of `codeparse`, the small comments
     // /*sc*/, /**/ etc. delimitate beginnings and ends of strings,
     // comments and regexps, for unit testing: ./codeparse_test.js

     function codeparse( /*sc*//*string*//**/code, /*sc*//*?object?*//**/opt )
     /*{0*/{
         var /*vd*/reservedArr/**/ = ((opt  &&  opt.reservedArr)  ||  RESERVED_ARR).concat( (opt  &&  opt.extraReservedArr)  ||  [] )
         ,   /*vd*/extraBracketArr/**/ = EXTRA_BRACKET_ARR.concat( (opt  &&  opt.extraBracketArr)  ||  [] )
         ,   /*vd*/ret/**/ = /*{1*/{
             strArr : []
             , commentArr  : []
             , regexpArr   : []
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

             , functionDeclarationArr : []
             , functionExpressionArr : []

             /*dc*/// JSM extensions
             , jsmMetafunArr  : []
             , jsmMetaretArr  : []

             /*dc*/// Raw result of acorn.parse
             , rawAP : null

         }/*}1*/


         /*dc*/// Detect comments, and produce a "nakedCode"
         /*dc*/// string where they've all been replaced with spaces.
         , /*vd*/nakedCode/**/ = code
         ;



	 var /*vd*/cA/**/ = ret.commentArr
         ,   /*vd*/ap/**/ = ret.rawAP = acorn.parse( code, /*{1.0*/{ jsm : true, onComment : pushComment }/*}1.0*/ )
         ;

         function pushComment( b, t, start, end  )
         /*{1.1*/{
             cA.push( /*{1.1.1*/{ begin : start, str : code.substring( start, end ) }/*}1.1.1*/ );
             nakedCode = nakedCode.substring( 0, start ) + str_repli( /*sq*/' '/**/, end - start ) + nakedCode.substring( end );
         }/*}1.1*/


         /*dc*/// Walk the tree and extract what we need for metaret.js and inline.js
         
         var /*vd*/tmp/**/
         ,   /*vd*/caA/**/       = ret.callArr
         ,   /*vd*/dA/**/        = ret.dotArr
         ,   /*vd*/dcaA/**/      = ret.dotcallArr
         ,    /*vd*/iA/**/ = ret.identifierArr
         ,   /*vd*/rxA/**/ = ret.regexpArr
         ,    /*vd*/sA/**/ = ret.strArr

         ,   /*vd*/fdA/**/  = ret.functionDeclarationArr
         ,   /*vd*/feA/**/  = ret.functionExpressionArr

         ,   /*vd*/jMFA/**/ = ret.jsmMetafunArr
         ,   /*vd*/jMRA/**/ = ret.jsmMetaretArr
         
         /*dc*/// Detect strings and RegExps, and produce a "nakedCodeNoStrNoRx"
         /*dc*/// string where they've all been replaced with spaces.
         , /*vd*/nakedCodeNoStrNoRx/**/ = nakedCode
         ;

         acorn.walk.simple( ap, /*{1.2*/{
             CallExpression          : meet_CallExpression
             , FunctionDeclaration   : meet_FunctionDeclaration
             , FunctionExpression    : meet_FunctionExpression
             , Identifier            : meet_Identifier
             , JsmMetafunDeclaration : meet_JsmMetafunDeclaration
             , JsmMetafunExpression  : meet_JsmMetafunExpression
             , Literal               : meet_Literal
             , MemberExpression      : meet_MemberExpression
             , NewExpression         : meet_CallExpression
             , ObjectExpression      : meet_ObjectExpression
             , VariableDeclaration   : meet_VariableDeclaration
         }/*}1.2*/);

         caA .sort( compare_begin );
         dA  .sort( compare_begin );
         dcaA.sort( compare_begin );
         iA  .sort( compare_begin );
         rxA .sort( compare_begin );
         sA  .sort( compare_begin );
         
         function meet_CallExpression( node )
         /*{1.3*/{
             var /*vd*/callee/**/ = node.callee;
             if (callee.type === /*dq*/"Identifier"/**/)
             /*{1.3.1*/{
                 
                 var /*vd*/begin/**/ = callee.start
                 ,   /*vd*/parI/**/  = nakedCode.indexOf( /*dq*/"("/**/, callee.end )
                 ;
                 if (parI < 0)
                     throw new Error( /*sq*/'meet_CallExpression bug'/**/ );
                 
                 var /*vd*/str/**/ = code.substring( begin, parI + 1 );
                 
                 caA.push( /*{1.3.1.1*/{ begin : begin, str : str, name : callee.name, acornNode : node }/*}1.3.1.1*/ );

                 for (var /*vd*/i/**/ = iA.length; i--;)
                 /*{1.3.1.2*/{
                     if (callee === iA[ i ].acornNode)
                     /*{1.3.1.2.1*/{
                         iA.splice( i, 1 );
                         break;
                     }/*}1.3.1.2.1*/
                     else if (iA[ i ].begin < callee.start)
                     /*{1.3.1.2.2*/{
                         break;
                     }/*}1.3.1.2.2*/
                 }/*}1.3.1.2*/
             }/*}1.3.1*/
             else if (callee.type === /*dq*/"MemberExpression"/**/)
             /*{1.3.2*/{
                 var /*vd*/cp/**/ = callee.property
                 , /*vd*/name/**/ = cp.name
                 , /*vd*/dotI/**/ = nakedCode.lastIndexOf( /*sq*/'.'/**/, cp.start )
                 , /*vd*/parI/**/ = nakedCode.indexOf( /*dq*/"("/**/, cp.end )
                 ;
                 if (dotI < 0  ||  parI < 0)
                     throw new Error( /*sq*/'meet_CallExpression bug'/**/ );

                 dcaA.push( /*{1.3.2.1*/{ begin : dotI, str : code.substring( dotI, parI + 1 ), name : name, acornNode : node }/*}1.3.2.1*/ );

                 for (var /*vd*/i/**/ = dA.length; i--;)
                 /*{1.3.2.2*/{
                     if (cp === dA[ i ].acornNode)
                     /*{1.3.2.2.1*/{
                         dA.splice( i, 1 );
                         break;
                     }/*}1.3.2.2.1*/
                     else if (dA[ i ].begin < cp.start)
                     /*{1.3.2.2.2*/{
                         break;
                     }/*}1.3.2.2.2*/
                 }/*}1.3.2.2*/
             }/*}1.3.2*/            
             else
                 throw new Error( /*dq*/"bug"/**/ );
         }/*}1.3*/

         function meet_FunctionDeclaration( node )
         /*{1.35*/{
             var /*vd*/name/**/ = node.id.name;
             (name  ||  0).substring.call.a;

             var /*vd*/begin/**/ = node.id.start;
             begin.toPrecision.call.a;

             var /*vd*/parI/**/ = nakedCode.indexOf( /*dq*/"("/**/, node.id.end )
             ,   /*vd*/str/**/  = nakedCode.substring( begin, parI + 1 )
             ;
             
             caA.push( /*{1.35.1*/{ begin : begin, str : str, name : name, acornNode : node }/*}1.35.1*/ );

             node.params.forEach( meet_Identifier );

             fdA.push( /*{1.35.2*/{ begin : node.start, str : nakedCode.substring( node.start, node.end ), type : node.type, name : name, acornNode : node }/*}1.35.2*/ );
         }/*}1.35*/

         function meet_FunctionExpression( node )
         /*{1.37*/{
             node.params.forEach( meet_Identifier );

             feA.push( /*{1.35.2*/{ begin : node.start, str : nakedCode.substring( node.start, node.end ), type : node.type, name : name, acornNode : node }/*}1.35.2*/ );
         }/*}1.37*/

         function meet_JsmMetafunDeclaration( node )
         /*{1.381*/{

             var /*vd*/name/**/ = node.id.name;
             (name  ||  0).substring.call.a;

             jMFA.push( /*{1.3811*/{ begin : node.start, str : nakedCode.substring( node.start, node.end ), type : node.type, name : name, acornNode : node }/*}1.3811*/ );
         }/*}1.381*/

         function meet_JsmMetafunExpression( node )
         /*{1.382*/{
             
         }/*}1.382*/

         function meet_Identifier( node )
         /*{1.4*/{
             iA.push( /*{1.41*/{ begin : node.start, str : node.name, name : node.name, acornNode : node }/*}1.41*/ );
         }/*}1.4*/

         function meet_Literal( node ) 
         /*{1.5*/{
             var /*vd*/v/**/ = node.value
             , /*vd*/wto/**/ = null
             , /*vd*/isString/**/
             , /*vd*/isRegExp/**/
             ;
             
             if (isString = (/*sq*/'string'/**/ === typeof v))    wto = sA;
             else if (isRegExp = (v instanceof RegExp)) wto = rxA;

             if (wto)
                 wto.push( /*{1.5.1*/{ begin : node.start, str : node.raw, acornNode : node }/*}1.5.1*/ );

             if (isString  ||  isRegExp)
             /*{1.5.2*/{
                 nakedCodeNoStrNoRx = nakedCodeNoStrNoRx.substring( 0, node.start ) + str_repli( /*sq*/' '/**/, node.end - node.start ) + 
                     nakedCodeNoStrNoRx.substring( node.end );
             }/*}1.5.2*/

         }/*}1.5*/
         
         function meet_MemberExpression( node )
         /*{1.6*/{
             var /*vd*/p/**/ = node.property;
             if (!node.computed  &&  p.type === /*dq*/"Identifier"/**/)
             /*{1.6.1*/{
              
                 var /*vd*/dotI/**/ = nakedCode.lastIndexOf( /*sq*/'.'/**/, p.start );
                 if (dotI < 0)
                     throw new Error( /*sq*/'meet_MemberExpression bug'/**/ );

                 dA.push( /*{1.6.1.1*/{ begin : dotI, str : code.substring( dotI, p.start + p.name.length ), name : p.name, acornNode : p }/*}1.6.1.1*/ );

             }/*}1.6.1*/
         }/*}1.6*/
         
         function meet_ObjectExpression( node )
         /*{1.65*/{
             node.properties.forEach( function (p) /*{1.65.1*/{
                 var /*vd*/k/**/ = p.key;
                 if (k.type === /*dq*/"Identifier"/**/)
                     meet_Identifier( k );
                 else
                     throw new Error( /*dq*/"Whatever"/**/ );
             }/*}1.65.1*/);
         }/*}1.65*/

         function meet_VariableDeclaration( node )
         /*{1.7*/{
             node.declarations.forEach( function (n) /*{1.7.1*/{ meet_Identifier( n.id ); }/*}1.7.1*/ );
         }/*}1.7*/
         
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
         
         find_bracket( find_bracket_cfg, nakedCodeNoStrNoRx, code, bA );
                 
         build_bracket_tree( bA, ret.bracketTree );
         build_bracket_sep_split( bA, nakedCodeNoStrNoRx, code, reservedArr );
         build_bracket_var_leftstr_rightstr( bA, cA );


         jMRA.push.apply( jMRA, bA.filter( function (b) /*{7ee*/{ return b.typebracket === /*sq*/'metaret'/**/; }/*}7ee*/ ) );

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
	      iO[ x.str ] !== _emptyObj[ x.str ] ? iO[ x.str ] : (iO[ x.str ] = [])
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
	      cO[ x.name ] !== _emptyObj[ x.name ]  ?  cO[ x.name ]  :  (cO[ x.name ] = [])
	      )
		 .push( x.begin )
		 ;
	 }/*}4c*/

         var /*vd*/iOR/**/ = ret.identifierObjReverse = /*{a5*/{}/*}a5*/;
         for (var /*vd*/str/**/ in iO) /*{5*/{ if (!(str in iOR)) /*{5.1*/{

             iOR[ str ] = reversed( iO[ str ] );
             
         }/*}5.1*/}/*}5*/
                

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

         /*dc*/// Detect identifiers and reserved words
         
         /* xxx reservedArr/Set first not thought as necessary outside, now that we are using acorn
         // var /*vd*/reservedSet/**/ = /*{2a*/{}/*}2a*/;
         // for (var /*vd*/i/**/ = reservedArr.length; i--;)  
         //     reservedSet[ reservedArr[ i ] ] = 1;
         // 
         // var /*vd*/resA/**/      = ret.reservedArr
         // */


         // /*dc*/// Reserved words: a few derived values, for convenience
         // var /*vd*/rA/**/ = ret.reservedArr
         // ,   /*vd*/rO/**/ = ret.reservedObj
         // ;
         // for (var /*vd*/n/**/ = rA.length, /*vd*/i/**/ = 0; i < n ; i++)
         // /*{6a*/{
         //     var /*vd*/x/**/ = rA[ i ];
         //     (
	 //      rO[ x.name ] !== _emptyObj[ x.name ]  ? rO[ x.name ] :  (rO[ x.name ] = [])
         //     )
         //         .push( x.begin );
         // }/*}6a*/


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


     function build_bracket_sep_split( /*array*/bA, /*string*/nakedCodeNoStrNoRx, /*string*/code, /*array of string*/reservedArr )
     {
         for (var i = bA.length; i--;)
         {
             var      x = bA[ i ]
             ,     kids = x.bracketchildren
             , nakedOne = nakedCodeNoStrNoRx.substring( x.begin, x.end )
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
		 // xxx wrong, remove this line: .concat( reservedArr.map( function (w) { return '\\b' + w + '\\b'; } ) )
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
                 if (!str  ||  /^\s*$/.test(nakedCodeNoStrNoRx.substring( begin, end )))
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
         for (var i = bA.length, i_cA = commentArr.length; i--;)
         {
             var brack = bA[ i ];
             if (brack.typebracket !== VAR)
                 continue;
             
             var vdArr = brack.vdArr = [];
             
             var s_arr = brack.sepSplit;
             for (var nj = s_arr.length, j = 0; j < nj; j++)
             {
                 var s = s_arr[ j ]
                 , str = s.hasOwnProperty( 'str_noComments' )
		     ? s.str_noComments
		     : (s.str_noComments = 
			( /\/\*|\*\//.test( s.str )  
			  ? removeComments( s )
			  : s.str
			  ).replace( /^\s*|\s*$/g, '' )
			)
		     
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
	     if (0 < i_cA)
		 {
		     for (; i_cA--;)
			 {
			     var c = commentArr[ i_cA ];
			     if (c.end > end)
				 continue;
			     
			     if (c.end < begin)
				 {
				     i_cA++;
				     break;
				 }
			     
			     str = str.substring( 0, c.begin - begin )
				 + str.substring( c.end - begin );
			 }
		 }
	     return str;
         }
     }


     function find_bracket( /*array*/cfgA, /*string*/nakedCodeNoStrNoRx, /*string*/code, /*array*/bA )
     {
         // First, find all open & close occurences, in a single pass
         // to keep the order they appear in `nakedCodeNoStrNoRx`.
         
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
         while (mo = rx.exec( nakedCodeNoStrNoRx ))
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
	     {
		 var last = pile[ pile.length - 1 ];
		 global.console  &&  global.console.error("last:",last);
             throw new Error( 'Unbalanced brackets: missing a closing "' + last.x.close + '" for {open:"' + last.x.open + '", begin:<char:' + last.x.begin + '>}. Did you forget a semicolon, maybe?' );
	     }
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
