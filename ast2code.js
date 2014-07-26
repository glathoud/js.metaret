/*global minify need$ load codeparse cp2fmtree*/

(function (global) {

    // ---------- Public API

    global.ast2code = ast2code;

    function ast2code( /*object*/ast, /*?object?*/opt )
    // Returns a code string.
    {
        return ast2arr( ast, opt ).join( '' );       
    }

    // ---------- Private implementation

    function ast2arr( /*object | array*/ast, /*?object?*/opt, /*?object?*/extra )
    // Returns an array of code strings.
    //
    // Notes:
    //
    // When `opt.ret` array defined, modifies it in-place (imperative
    // mode, useful for recursion, avoids creating many small arrays).
    //
    // When `opt.ret` array not defined, a new array is returned
    // (functional mode, useful for the top-level call).
    //
    // Guillaume Lathoud
    // glathoud@yahoo.fr
    {
        opt  ||  (opt = {});
        var ret = opt.ret  ||  (opt.ret = [])
        ,   jsm = opt.jsm
        ;

        var array_sep = extra  &&  extra.array_sep
        ,   parent    = extra  &&  extra.parent
        , isLeftChild = extra  &&  extra.isLeftChild
        ;
        
        if (ast instanceof Array)
        {
            for (var n = ast.length, i = 0; i < n; i++)
            {
                if (0 < i  &&  array_sep)
                    ret.push( array_sep );
                
                ast2arr( ast[ i ], opt, { parent : extra  &&  extra.parent } );
            }
            
            return ret;           
        }
        
        if (array_sep)
            throw new Error( 'bug' );
        
        switch(ast.type) {

        case 'ArrayExpression':
            ret.push( '[' );
            var elt = ast.elements;
            for (var ne = elt.length, ie = 0; ie < ne; ie++)
            {
                if (0 < ie)
                    ret.push( ',' );
                ast2arr( elt[ ie ], opt, { parent : ast } );
            }
            ret.push( ']' );
            return ret;

        case 'AssignmentExpression':
            var nds_prn = needs_parentheses( parent, ast, isLeftChild );
            if (nds_prn) ret.push( '(' );
            ast2arr( ast.left, opt, { parent : ast, isLeftChild : true } );
            ret.push( ast.operator );
            ast2arr( ast.right, opt, { parent : ast, isLeftChild : false } );
            if (nds_prn) ret.push( ')' );
            return ret;
            
        case 'BinaryExpression':
        case 'LogicalExpression':
            var nds_prn = needs_parentheses( parent, ast, isLeftChild )
            ,   left = ast.left
            ,  right = ast.right
            ;
            if (nds_prn) ret.push( '(' );
            ast2arr( left, opt, { parent : ast, isLeftChild : true } );
            ret.push( /^\w+$/.test( ast.operator )  ?  ' ' + ast.operator + ' '  :  ast.operator );
            ast2arr( right, opt, { parent : ast, isLeftChild : false } );
            if (nds_prn) ret.push( ')' );
            return ret;

        case 'BlockStatement': 
            ret.push( '{' );
            ast2arr( ast.body, opt, { parent : ast } );
            ret.push( '}' );
            return ret;
            
        case 'BreakStatement':
        case 'ContinueStatement':
            ret.push( ast.type === 'BreakStatement'  ?  'break'  :  'continue' );
            var label = ast.label;
            if (label)
            {
                ret.push( ' ' );
                ast2arr( label, opt, { parent : ast } );
            }
            ret.push( ';' );
            return ret;

        case 'CallExpression':
            var isFun = /function/i.test( ast.callee.type );
            if (isFun)  ret.push( '(' );
            ast2arr( ast.callee, opt, { parent : ast, isLeftChild : true } );
            if (isFun)  ret.push( ')' );
            ret.push( '(' );
            ast2arr( ast.arguments, opt, { parent : ast, array_sep : ',' } );
            ret.push( ')' );
            return ret;

        case 'CatchClause':
            ret.push( 'catch(' );
            ast2arr( ast.param, opt, { parent : ast } );
            ret.push( ')' );
            ast2arr( ast.body,  opt );
            return ret;

        case 'ConditionalExpression':
            var nds_prn = needs_parentheses( parent, ast, isLeftChild );
            if (nds_prn) ret.push( '(' );
            ast2arr( ast.test, opt, { parent : ast, isLeftChild : true } );
            ret.push( '?' );
            ast2arr( ast.consequent, opt, { parent : ast, isLeftChild : false } );
            ret.push( ':' );
            ast2arr( ast.alternate, opt, { parent : ast, isLeftChild : false } );
            if (nds_prn) ret.push( ')' );
            return ret;

        case 'DoWhileStatement':
            ret.push( 'do ' );
            ast2arr( ast.body, opt, { parent : ast } );
            ret.push( ' while(' );
            ast2arr( ast.test, opt, { parent : ast } );
            ret.push( ')' );
            return ret;
        
        case 'EmptyStatement':
            ret.push( ';' );
            return ret;

        case 'ExpressionStatement':
            ast2arr( ast.expression, opt, { parent : ast } );
            ret.push( ';' );
            return ret;

        case 'ForStatement':
            ret.push( 'for(' );
            
            if (ast.init)
            {
                ast2arr( ast.init, opt, { parent : ast } );
            }
            else
            {
                ret.push( ';' );
            }
            
            if (ast.test)
            {
                ast2arr( ast.test, opt, { parent : ast } );
                ret.push( ';' );
            }
            else
            {
                ret.push( ';' );
            }
            
            if (ast.update)
                ast2arr( ast.update, opt, { parent : ast } );
            
            ret.push( ')' );
            ast2arr( ast.body, opt, { parent : ast } );
            return ret;

        case 'FunctionDeclaration':
        case 'FunctionExpression':
            ret.push( 'function ' );
            if (ast.id)
                ast2arr( ast.id, opt, { parent : ast } );
            ret.push( '(' );
            ast2arr( ast.params, opt, { parent : ast, array_sep : ',' } );
            ret.push( ')' );
            ast2arr( ast.body, opt, { parent : ast } );
            return ret;

        case 'ForInStatement': 
            ret.push( 'for(' );
            ast2arr( ast.left, opt, { parent : ast } );

            var ilast = ret.length - 1;
            ret[ ilast ] = ret[ ilast ].replace( /;\s*$/, '' );
            
            ret.push( ' in ' );
            ast2arr( ast.right, opt, { parent : ast } );
            ret.push( ')' );
            ast2arr( ast.body, opt, { parent : ast } );
            return ret;

        case 'Identifier': 
            ret.push( ast.name );
            return ret;

        case 'IfStatement':
            ret.push( 'if(' );
            ast2arr( ast.test, opt, { parent : ast } );
            ret.push( ')' );
            ast2arr( ast.consequent, opt, { parent : ast } );
            if (ast.alternate)
            {
                ret.push( ' else ' );
                ast2arr( ast.alternate, opt, { parent : ast } );
            }
            return ret;

        case 'LabeledStatement':
            ast2arr( ast.label, opt, { parent : ast } );
            ret.push( ':' );
            ast2arr( ast.body, opt, { parent : ast } );
            return ret;

        case 'Literal': 
            ret.push( ast.raw );
            return ret;
            
        case 'MemberExpression':
            ast2arr( ast.object, opt, { parent : ast } );
            ret.push( ast.computed  ?  '['  :  '.' );
            ast2arr( ast.property, opt, { parent : ast } );
            if (ast.computed)
                ret.push( ']' );
            return ret;

        case 'NewExpression':
            ret.push( 'new ' );
            ast2arr( ast.callee, opt, { parent : ast, isLeftChild : true } );
            
            var arg = ast.arguments;
            if (arg)
            {
                ret.push( '(' );
                ast2arr( arg, opt, { parent : ast, array_sep : ',' } );
                ret.push( ')' );
            }
            return ret;

        case 'ObjectExpression':
            ret.push( '{' );
            var prop = ast.properties;
            for (var np = prop.length, ip = 0; ip < np; ip++)
            {
                if (0 < ip)
                    ret.push( ',' );
                
                var pi = prop[ ip ];
                if (pi.kind !== 'init')
                    throw new Error( 'ast2arr: unknown kind of object property' );

                ast2arr( pi.key, opt, { parent : ast } );
                ret.push( ':' );
                ast2arr( pi.value, opt, { parent : ast } );
            }
            
            ret.push( '}' );
            return ret;

        case 'Program': 
            ast2arr( ast.body, opt, { parent : ast } );
            return ret;

        case 'ReturnStatement':
            ret.push( 'return' );
            if (ast.argument)
            {
                ret.push( ' ' );
                ast2arr( ast.argument, opt, { parent : ast } );
            }
            ret.push( ';' );
            return ret;

        case 'SequenceExpression':
            var es = ast.expressions;
            for (var nes = es.length, ies = 0; ies < nes; ies++)
            {
                var e = es[ ies ];
                if (0 < ies)   ret.push( ',' );
                ast2arr( e, opt, { parent : ast } );
            }
            return ret;

        case 'SwitchCase':
            if (!ast.test)
            {
                ret.push( 'default:' );
            }
            else
            {
                ret.push( 'case ' );
                ast2arr( ast.test, opt, { parent : ast } );
                ret.push( ':' );
            }
            ast2arr( ast.consequent, opt, { parent : ast } );
            return ret;

        case 'SwitchStatement':
            ret.push( 'switch(' );
            ast2arr( ast.discriminant, opt, { parent : ast } );
            ret.push( '){' );
            ast2arr( ast.cases, opt, { parent : ast } );
            ret.push( '}' );
            return ret;

        case 'ThisExpression':
            ret.push( 'this' );
            return ret;

        case 'ThrowStatement':
            ret.push( 'throw ' );
            ast2arr( ast.argument, opt, { parent : ast } );
            ret.push( ';' );
            return ret;
            
        case 'TryStatement':
            ret.push( 'try ' );
            ast2arr( ast.block, opt, { parent : ast } );
            if (ast.handler)   ast2arr( ast.handler,   opt );
            if (ast.finalizer) ast2arr( ast.finalizer, opt, { parent : ast } );
            return ret;

        case 'UnaryExpression':
        case 'UpdateExpression':
            var nds_prn = needs_parentheses( parent, ast, isLeftChild )
            ,    op = ast.operator
            ,   arg = ast.argument
            ;
            if (nds_prn) ret.push( '(' );
            if (ast.prefix)
            {
                ret.push( op );
                if (/^\w+$/.test( op ))  ret.push( ' ' );
                ast2arr( arg, opt, { parent : ast, isLeftChild : false } );
            }
            else
            {
                ast2arr( arg, opt, { parent : ast, isLeftChild : true } );
                ret.push( op );                
            }
            if (nds_prn) ret.push( ')' );
            return ret;            

        case 'VariableDeclaration':
            var decl = ast.declarations;
            for (var nd = decl.length, id = 0; id < nd; id++)
            {
                ret.push( id < 1  ?  'var '  :  ',' );
                ast2arr( decl[ id ], opt, { parent : ast } );
            }
            ret.push(';');
            return ret;
        
        case 'VariableDeclarator':
            ret.push( ast.id.name );
            var init = ast.init;
            if (init)
            {
                ret.push( '=' );
                ast2arr( init, opt, { parent : ast } );
            }
            return ret;

        case 'WhileStatement':
            ret.push( 'while(' );
            ast2arr( ast.test, opt, { parent : ast } );
            ret.push( ')' );
            ast2arr( ast.body, opt, { parent : ast } );
            return ret;
        }

        console.error('xxx  unknown type ' + ast.type );
        error.bug;
    }

    function needs_parentheses( parent, ast, isLeftChild )
    {
        if (!parent)
            return false;

        // Special cases: they already wrap arguments with parentheses/brackets anyway
        if (((parent.type === 'CallExpression'  ||  parent.type === 'NewExpression')  &&  ast !== parent.callee)  ||
            (parent.type === 'MemberExpression'  &&  parent.computed  &&  ast === parent.property)
           ) return false;

        var ppar = precedence( parent )
        ,   past = precedence( ast )
        ;

        // Parent not an operator, no need for extra parentheses.
        // e.g. `if(a > b)` and not `if((a > b))`
        if (ppar == null)
            return false;

        // Both parent and child are operators, and have the same
        // precedence. Try to reduce the number of parentheses based
        // on associativity direction.
        var l2r;
        if (ppar === past  &&  
            null != isLeftChild  &&
            null != (l2r = has_l2r_associativity( parent ))  &&
            isLeftChild === l2r
           ) 
            return false;
            
        // All other cases
        return !(ppar > past);
    }

    function precedence( ast )
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
    {
        var t = ast.type      // always
        ,  op = ast.operator  // if any
        , pre = ast.prefix    // if any

        , tNE  = t === 'NewExpression'
        ;
        
        if (t === 'MemberExpression'  ||  tNE && ast.arguments)
            return 1;

        if (t === 'CallExpression'  ||  tNE && !ast.arguments)
            return 2;

        var tUpE = t === 'UpdateExpression';

        if (tUpE  &&  !pre  &&  (op === '++'  ||  op === '--'))
            return 3;

        var tUnE = t === 'UnaryExpression';
        
        if ((tUpE  &&  pre  &&  (op === '++'  ||  op === '--'))  ||
            (tUnE  &&  pre  &&  (op === '!'  ||  op === '~'  ||  op === '+'  ||  op === '-'  ||  op === 'typeof'  ||  op === 'void'  ||  op === 'delete'))
           )
            return 4;

        if (t === 'BinaryExpression')
        {
            if (op === '*'  ||  op === '/'  ||  op === '%')
                return 5;

            if (op === '+'  ||  op === '-')
                return 6;
            
            if (op === '<<'  ||  op === '>>'  ||  op === '>>>')
                return 7;
            
            if (op === '<'  ||  op === '<='  ||  op === '>'  ||  op === '>='  ||  op === 'in'  ||  op === 'instanceof')
                return 8;

            if (op === '=='  ||  op === '!='  ||  op === '==='  ||  op === '!==')
                return 9;

            if (op === '&')
                return 10;

            if (op === '^')
                return 11;

            if (op === '|')
                return 12;
        }

        if (t === 'LogicalExpression')
        {
            if (op === '&&')
                return 13;
            
            if (op === '||')
                return 14;
        }

        if (t === 'ConditionalExpression')
            return 15;

        // yield not supported yet by acorn

        if (t === 'AssignmentExpression')
            return 17;

        // spread not supported yet by acorn

        if (t === 'SequenceExpression')
            return 19;
    }

    function has_l2r_associativity( ast )
    // Returns `true`, `false` or `null` if not applicable.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
    {
        var t = ast.type      // always
        ,  op = ast.operator  // if any
        , pre = ast.prefix    // if any
        ;
        
        if (t === 'MemberExpression')
            return true;
        
        if (t === 'CallExpression')
            return true;

        if (t === 'NewExpression'  &&  !ast.arguments)
            return false;
        
        var tUpE = t === 'UpdateExpression'
        ,   tUnE = t === 'UnaryExpression'
        ;
        if ((tUpE  &&  pre  &&  (op === '++'  ||  op === '--'))  ||
            (tUnE  &&  pre  &&  (op === '!'  ||  op === '~'  ||  op === '+'  ||  op === '-'  ||  op === 'typeof'  ||  op === 'void'  ||  op === 'delete'))
           )
            return false;
        
        if (t === 'BinaryExpression'  ||  t === 'LogicalExpression')
            return true;
  
        if (t === 'ConditionalExpression'  ||  t === 'AssignmentExpression') // yield not supported yet by acorn
            return false;
        
        if (t === 'SequenceExpression')
            return true;

        return null;
    }

})(this);
