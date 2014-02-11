function to_be_inlined(opt1,opt2)
{
    'not doing much, just testing :)';
    opt1 = 1 + (opt1 || 0) + (opt2 || 0);
    if (('undefined' !== typeof console)  &&  console.log)
        console.log('to_be_inlined: opt1 result:', opt1);

    // https://github.com/glathoud/js.metaret/issues/7

    // To test the detection of infinite `inline` recursion
    // uncomment the following line. An error should be thrown.
    // inline to_be_inlined_imbricated();

    return opt1;

    this.line.will.never.be.reached();
}


function to_be_inlined_imbricated(some,optional,parameters)
{
    'still testing :)';
    // https://github.com/glathoud/js.metaret/issues/6

    var arr = [];

    for (var i = 0; i < 3; i++)
    {   
        inline var a = to_be_inlined();     
        arr.push( a );
    }

    return arr;
}
