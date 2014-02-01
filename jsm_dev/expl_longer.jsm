metafun sortedSearch(self, sortedArray, x, /*?fun?*/less, /*?fun?*/equal)
//  Search a sorted array e.g. [ 0, 1, 1, 2, 4, 6, 6, 6, 9, 11, 11, 12 ]
//  for the first and last position of a target value e.g. 6 appears
//  first at position 5 and last at position 7 -> return `[ 5, 7 ]`.
//
//  If the target value was found, return:
//
//  [ &lt;integer (first position)&gt;, &lt;integer (last position)&gt; ]
//
//  else return:
//
//  null
//
//  Using the optional `less` and `equal` parameters, one can search any
//  type of value, not just numbers.
//
//  Implementation: joint bisection: alternatively improve `first` and
//  `last`.
//
// Guillaume Lathoud
// glathoud@yahoo.fr
{
    // In a sorted array, search for first and last occurences of `x`.
    //
    // If `x` found, return `[ first_index, last_index ]`
    // (integers).
    //
    // If `x` not found, return `null`.

    less  ||  (less = function (a,b) { return a < b; });
    equal ||  (equal = function (a,b) { return a == b; });

    var first_found = false
    ,    last_found = false
    ,             i = 0
    ,             j = sortedArray.length - 1
    ,          imax = j
    ,          jmin = i
    ;

    metaret improveFirst;


    metafun improveFirst(self)
    {
        if (!first_found)
            inline first_found = isFirstFound(sortedArray, i, equal, x);

        // Termination tests

        if (i > j)
            return null;    // Done: `x` not found.

        if (first_found && last_found)
            return [i, j];  // Done: `x` found.

        // Update

        if (!first_found)
        {
            i++;

            imax = Math.min( imax, j );

            var ind = i + ((imax - i) >> 1)
            , v_ind = sortedArray[ind]
            ;

            if (less(v_ind, x) ||
                isFirstFound(sortedArray, ind, equal, x)
               )
                i = ind;
            else
                imax = ind;
        }

        metaret improveLast;
    }


    metafun improveLast(self)
    {
        if (!last_found)
            inline last_found = isLastFound(sortedArray, j, equal, x);

        // Termination tests already done in `improveFirst`, 
        // not needed here.

        // Update

        if (!last_found)
        {
            j--;

            jmin = Math.max( jmin, i );

            var ind = j - ((j - jmin) >> 1)
            , v_ind = sortedArray[ind]
            ;

            if (less(x, v_ind) ||
                isLastFound(sortedArray, ind, equal, x)
               )
                j = ind;
            else
                jmin = ind;
        }

        metaret improveFirst;
    }

    function isFirstFound( sortedArray, i, equal, x )
    {
        return equal(x, sortedArray[i])  &&
            (i < 1  ||  !equal(x, sortedArray[i - 1]));
    }

    function isLastFound( sortedArray, j, equal, x)
    {
        return equal(x, sortedArray[j])  &&
            (j > sortedArray.length - 2  || !equal(x, sortedArray[j + 1]));
    }

}
