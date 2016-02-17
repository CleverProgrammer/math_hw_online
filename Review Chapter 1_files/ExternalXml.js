/**
 * ExternalXml Object
 * This object is utilized to get an external xml file to convert each tag 
 * in a operation to draw an specific formula.
 * 
 * @author Perretta Marcelo - VPA 2012
 */

var ExternalXml = function(){
    var $ = jQuery;
    var self = this,
        formula = '',
        operationsData,
        utfMap;

    var unicodeUtil = new UnicodeUtil();

    function xmlToLaTex(xmlData){
        var output = '',
            buttonConfig = $.INST().data.buttonConfig;
        
        self.operationsData = buttonConfig.operations;
        self.utfMap = buttonConfig.utfmap;
        var extXml = $($.parseXML(xmlData)).find('me').children();

        return getData(extXml);
    }
    
    function writeFormula(tag, counter){
        var localOutput = '';
        var tagObject = $(tag);
        var tagName = $(tag).get(0).tagName.toLowerCase();
        
        switch(tagName){
            case 'l':
                var type = tagObject.children('t').text();
                var char = tagObject.children('utf').text();

                switch(type) {
                    case 'ln':
                    case 'log':
                        localOutput += " " + self.operationsData[type].symbol;
                        counter.i += (type.length - 1);
                        break;
                    case 'trig':
                        localOutput += getWord(char);
                        break;
                    case 'space':
                        localOutput += '\\space ';
                        break;
                    case 'greek-lower':
                    case 'greek-upper':
                    case 'operator':
                    case 'symbol':
                    case 'number':
                    case 'var':
                    default:
                        localOutput += " " + getWord(char);
                        break;
                }
                break;
            case 'abs':
                localOutput += '\\left|' + getData(tagObject.children('a').children()) + '\\right|';
                break;
            case 'cs':
                localOutput += '\\text{' + tagObject.children('s').text() + '}';
                break;
            case 'fc':
                localOutput += '!';
                break;
            case 'f':
                localOutput += '\\frac{' + getData(tagObject.children('nm').children()) + '}{' + getData(tagObject.children('dn').children()) + '}';
                break;
            case 'r':    
                if(tagObject.children('rt').text() == ''){
                    localOutput += '\\sqrt{' + getData(tagObject.children('rd').children()) + '}';
                } else {
                    localOutput += '\\nthroot{' + getData(tagObject.children('rt').children()) + '}{' + getData(tagObject.children('rd').children()) + '}';
                }
                break;
            case 'sb':    
                localOutput += '_{'+ getData(tagObject.children('s').children()) + '}';
                break;
            case 'sp':    
                localOutput += '^{'+ getData(tagObject.children('e').children()) + '}';
                break;
            case 'spb':
                localOutput += '_{'+ getData(tagObject.children('s').children()) + '}^{'+ getData(tagObject.children('e').children()) + '}';
                break;
            case 'g':
                var open = 0;
                // var closingTag = tagObject.nextAll('g')
                var closingTag = tagObject.nextAll('g').filter(function() {
                    var type = $(this).children('e').text();
                    if (type == 'close' && open == 0) {
                        return true;
                    } else if (type == 'close') {
                        open--;
                    } else {
                        open++;
                    }
                    return false;
                }).first();

                switch(tagObject.children('t').text()){
                    case 'bracket':
                        if(tagObject.children('e').text() == 'open'){
                            localOutput += '\\left[';
                        } else {
                            localOutput += '\\right]';
                        }
                        break;
                    case 'paren':
                        if(tagObject.children('e').text() == 'open'){
                            localOutput += '\\left(';
                        } else {
                            localOutput += '\\right)';
                        }
                        break;
                    case 'brace':
                        if(tagObject.children('e').text() == 'open'){
                            localOutput += '\\left\\{';
                        } else {
                            localOutput += '\\right\\}';
                        }
                        break;
                    case 'vbracket':
                       if(tagObject.children('e').text() == 'open'){
                            localOutput += '\\langle{';
                        }
                        else {
                            localOutput += '}';
                        }
                       break;
                }
                break;
            case 'top':
                switch(tagObject.children('t').text()){
                    case 'arrow':
                        localOutput += '\\vec{';
                        break;
                    // TODO - why no hat :(
                    case 'hat':
                        localOutput += '\\hat{';
                        break;
                    case 'bar':
                        localOutput += '\\overline{';
                        break;
                }
                localOutput += getData(tagObject.children('b').children()) + '}';
                break;
            default:
                console.log("it's differente");
                break;
        }
        
        return localOutput;
    }
    
    function getWord(arrayChar)
    {
        var utf8 = self.utfMap[arrayChar];
        if ( utf8 ) {
            var latex = self.operationsData[utf8];
            return latex ? latex.symbol : utf8;
        }
        else if ( unicodeUtil.isBold(arrayChar) ) {
            return '\\bold{' + String.fromCharCode(unicodeUtil.convertCharFromBold(arrayChar)) + '}'; 
        }
        
        return String.fromCharCode(arrayChar);
    }

    function getData(arrayData){
        var output = '',
            trigOp = false,
            elem = {};

        for (elem.i = 0; elem.i < arrayData.length; elem.i++) {
            var $tag = $(arrayData[elem.i]);

            // If we are starting a trig function, we want to prefix it with
            // a "\" so that it will read as the correct laTeX (ex: \sin)
            if ($tag.find('t').text() == 'trig' && trigOp == false) {
                output += " \\";
                trigOp = true;
            } else if ($tag.find('t').text() != 'trig') {
                trigOp = false;
            }

            output += writeFormula($tag, elem);
        }

        return output;
    }
    
    return {
        /**
         * This method call the private method init 
         * 
         * @returns
         */
        xmlToLaTex:function(data, callback){
            return xmlToLaTex(data, callback);
        }
    };
};
