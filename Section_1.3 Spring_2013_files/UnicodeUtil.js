/**
 * Unicode provides decimal codes and methods for unicode characters.
 *
 */

var UnicodeUtil = function() {

    // https://en.wikipedia.org/wiki/Mathematical_operators_and_symbols_in_Unicode
    // http://unicodelookup.com/

    // greek small letter alpha - 945 BOLD -> 120514 ( 120514 - 945 = 119569 )
    // greek small letter omega - 969 BOLD -> 120538 ( 120538 - 969 = 119569 )
    // greek capital letter alpha - 913 BOLD -> 120488 ( 120488 - 913 = 119575 )
    // greek capital letter omega - 937 BOLD -> 120512  ( 120512 - 937 = 119575 )

    // 0-48  BOLD -> 120782 (120782 - 48 = 120734)
    // 9-57  BOLD -> 120791 (120791 - 57 = 120734)
    // A-65  BOLD -> 119808 (119808 - 65 = 119743)
    // Z-90  BOLD -> 119833 (119833 - 90 = 119743)
    // a-97  BOLD -> 119834 (119834 - 97 = 119737)
    // z-122 BOLD -> 119859 (119859 - 122 = 119737)

    var bold_zero = 120782;
    var bold_nine = 120791;
    var bold_A = 119808;
    var bold_Z = 119833;
    var bold_a = 119834;
    var bold_z = 119859;
    var bold_alpha = 120514;
    var bold_omega = 120538;
    var bold_Alpha = 120488;
    var bold_Omega = 120512;
    var upperGreekConversionFactor = 119575;
    var lowerGreekConversionFactor = 119569;
    var numericalConversionFactor = 120734
    var lowerCaseConversionFactor = 119737;
    var upperCaseConversionFactor = 119743;
    var upperGreekConversionFactor = 119575;
    var lowerGreekConversionFactor = 119569;
    var numericalConversionFactor = 120734
    var lowerCaseConversionFactor = 119737;
    var upperCaseConversionFactor = 119743;
    var zero = 48;
    var nine = 57;
    var A = 65;
    var Z = 90;
    var a = 97;
    var z = 122;
    var alpha = 945;
    var omega = 969;
    var Alpha = 913;
    var Omega = 937;

    function isBold(charCode) {
        if (
             ( charCode >= bold_A     && charCode <= bold_Z )     || // bold A-Z
             ( charCode >= bold_a     && charCode <= bold_z )     || // bold a-z
             ( charCode >= bold_Alpha && charCode <= bold_Omega ) || // bold upper alpha-omega
             ( charCode >= bold_alpha && charCode <= bold_omega ) || // bold lower alpha-omega
             ( charCode >= bold_zero  && charCode <= bold_nine )     // bold 0-9
           ) { 
            return true;
        } 

        return false;
    }

    /**
     * Convert a character from an equivalent unicode mathematical bold character.
     */
    function convertCharFromBold(charCode) {
        if ( charCode >= bold_zero && charCode <= bold_nine ) {
            charCode = charCode - numericalConversionFactor;

        } else if ( charCode >= bold_A && charCode <= bold_Z ) {
            charCode = charCode - upperCaseConversionFactor;

        } else if ( charCode >= bold_a && charCode <= bold_z ){
            charCode = charCode - lowerCaseConversionFactor;

        } else if ( charCode >= bold_alpha && charCode <= bold_omega ) {
            charCode = charCode - lowerGreekConversionFactor;

        } else if ( charCode >= bold_Alpha && charCode <= bold_Omega ) {
            charCode = charCode - upperGreekConversionFactor;
        }

        return charCode;
    }

    /**
     * Convert a character to an equivalent unicode mathematical bold character.
     */
    function convertCharToBold(charCode) {

        if ( charCode >= zero && charCode <= nine ) {
            charCode = charCode + numericalConversionFactor;

        } else if ( charCode >= A && charCode <= Z ) {
            charCode = charCode + upperCaseConversionFactor;

        } else if ( charCode >= a && charCode <= z ){
            charCode = charCode + lowerCaseConversionFactor;

        } else if ( charCode >= alpha && charCode <= omega ) {
            charCode = charCode + lowerGreekConversionFactor;

        } else if ( charCode >= Alpha && charCode <= Omega ) {
            charCode = charCode + upperGreekConversionFactor;
        }

        return charCode;
    }

    return {
        isBold: function(charCode) {
            return isBold(charCode);
        },

        convertCharToBold: function(charCode) {
            return convertCharToBold(charCode);
        },

        convertCharFromBold: function(charCode) {
            return convertCharFromBold(charCode);
        }
    }
};
