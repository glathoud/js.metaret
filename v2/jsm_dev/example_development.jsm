metafun gcd( self, a, b )
{
    if (a > b)
        metaret self, a-b, b;
    
    if (b > a)
        metaret self, b-a, a;
    
    return a; 
}
