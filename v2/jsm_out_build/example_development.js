function gcd(a,b)
{
    var _undef_;
    _L_gcd_: while (true) {

        // --- metafun gcd
        // --- ( self,a,b)

        {
            if (a > b)
                {
        var _a1_ = a-b;
        a = _a1_;
        continue _L_gcd_;
        }

            if (b > a)
                {
        var _a_ = b-a;
        var _b_ = a;
        a = _a_;
        b = _b_;
        continue _L_gcd_;
        }

            return a; 
        }
          return;
    }

}


