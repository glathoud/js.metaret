 need$( 'jsm_dev/expl.js' );
 need$( 'jsm_dev/expl_basic.jsm' );
 need$( 'jsm_dev/expl_longer.jsm' );

 function test()
 {
     return test_various_expl()  &&  test_jsm2js();


 function test_various_expl()
 {
     return [ 'expl', 'expl_basic', 'expl_longer' ].every( run_one_test );

     function run_one_test( name )
     {
	 return eval( need$.read( 'jsm_dev/' + name + '.test.js' ) + '; test()' );
     }
 }

 function test_jsm2js()
 {
     var jscode = jsm2js( 'metafun f(self,x) { metaret g,x,0; metafun g(self,x,acc) { if (!(x>0)) return acc;  metaret self,x-1,acc+x*x;}}' )
	 
	 , result = eval( jscode + '; f(4)' )
	 ;
     return /^\s*function\s/.test(jscode)  &&  result === 4*4+3*3+2*2+1*1;
 }

 }
