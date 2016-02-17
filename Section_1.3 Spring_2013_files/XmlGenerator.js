/**
 * XmlGenerator Object
 * This object is utilized to generate the xml string for a input, where there are a formula.
 * 
 * @author Perretta Marcelo - VPA 2012
 */

var XmlGenerator = function(){
    
    var output = '';
    var currentOperation = '';
    var formula = '';
    var symbols = ['\u2130', '\u2113', '\u22A5', '\u2225', '\u210F', '%'];

    var unicodeUtil = new UnicodeUtil();

    /**
     * This method run through the html structure created for the formula and set the xml string
     * 
     * @param object (DOM) data
     *
     * @returns string output
     */
    function getXmlData(data){
        var openingXml = '<?xml version="1.0"?><p v="1.0"><me>';
        var closingXml = '</me></p>';
        output = '';

        jQuery.each(jQuery(data).children(), function(key, value){
            if(jQuery(value).get(0).tagName != undefined){
                output += getOperation(value);
            }
        });

        output = output.replace('undefined', '');

        // If no output was generated, then treat it as a blank response box (because it is) and
        // return an empty string so that we don't accept the response and don't charge a submission.
        if (output === '') {
            return output;
        }

        return openingXml + output + closingXml;
    }

    // We use the classes to determine information about a node, such as if
    // its the root node, a paren, etc. However, MathQuill will sometimes have
    // nodes in the tree that add extra classes to a node, which throws off
    // the giant switch statements below. An example of this is labeling that a
    // node contains the cursor. Strip these out so that our switch statements don't
    // get donked up
    function getFormula(currentOperation) {
        var currentFormula = currentOperation.attr('class');

        if (currentFormula !== undefined) {
            currentFormula = currentFormula.replace('mq-hasCursor', '');
            currentFormula = currentFormula.replace('mq-ghost', '');
            currentFormula = currentFormula.replace('mq-empty', '');
            currentFormula = currentFormula.replace('  ', ' ');
            currentFormula = currentFormula.trim();
        }

        return currentFormula;
    }

    /**
     * This method run through an specific operation and seeks to discover 
     * what type the "operation" is and asing the correct string
     * 
     * @param object (DOM) operation
     *
     * @returns string
     */
    function getOperation(operation){
        currentOperation = jQuery(operation);

        formula = getFormula(currentOperation);
        var currentNode = currentOperation.get(0);
        var typeTag = currentNode.tagName;

        var isRootBlock = currentNode.hasClass('mq-root-block');
        var isNonLeaf = formula === 'mq-non-leaf';
        var isTextArea = currentNode.hasClass('mq-textarea');
        var isSelectionBlock = formula === 'mq-selection';

        // nthroot's immediate sibling will be a node with a formula of just mq-scaled.
        // This is the only time there will be a formula of just 'mq-scaled'
        var isNthRootBlock = formula === 'mq-scaled';

        // Skip the invisible textarea that mathquill uses to capture input
        if (isTextArea) {
            return '';
        }

        if (isRootBlock || isNonLeaf || isNthRootBlock || isSelectionBlock) {
            return getChildrenOperations(currentOperation);
        }

        // All Sup(erscript) and Sub(script) instances attached to something
        // will all appear in the same non-leaf node. The node will contain
        // up to 1 mq-sub and up to 1 mq-sup node. It will also contain a span
        // containing &#8203 (blank space). Catch the supsub node,
        // pull out its children, then send them through getOperation
        if (currentNode.hasClass('mq-supsub')) {
            var output = '';
            // If there is a sub and a sup together, take the sub first, then sup
            var subNode = currentOperation.children('.mq-sub')
            var supNode = currentOperation.children('.mq-sup');

            if (subNode.length) {
                output += '<sb><s>';
                output += getChildrenOperations(subNode[0]);
                output += '</s></sb>';
            }

            if (supNode.length) {
                output += '<sp><e>';
                output += getChildrenOperations(supNode[0]);
                output += '</e></sp>';
            }

            return output;
        }

        // mq-text-mode leafs can have extra classes for formatting and casing.
        // As such, grab it here so we don't have to do a bajillion case statements
        // However, let bold text on through since its used in vectors and we have to
        // remember that its bold
        if (currentNode.hasClass('mq-text-mode') && (typeTag !== 'B' && typeTag !== 'b')) {
            return setString(currentOperation, currentOperation.text());
        }

        switch(typeTag){
            case "VAR":
                return setString(currentOperation);
            case "SUP":
                if (currentNode.hasClass('mq-nthroot') && currentNode.hasClass('mq-non-leaf')) {
                    return '<r><t>nth</t><rt>' + getChildrenOperations(currentOperation) + '</rt>';
                }
            case "SPAN":
                return getSpanOperation();
            case "B":
                var text   = currentOperation.text(),
                    output = '';
                for( var i = 0; i < text.length; i++ ) {
                    output += '<l><t>symbol</t><utf>' + unicodeUtil.convertCharToBold(text.charCodeAt(i)) + '</utf></l>';
                }
                return output;
        }
    }
    
    /**
     * Loop over a node's children and send them through the getOperation function
     */
    function getChildrenOperations(operation) {
        var currentOperation = jQuery(operation);
        var output = '';
        var children = currentOperation.children();

        for (var i = 0; i < children.length; i++) {
            output = output + getOperation(children[i]);
        }

        return output;
    }

    /**
     * This method run through an specific operation that it's different's to before others,
     * and seeks to discover what type the "operation" is and asing the correct string
     *
     * @returns string
     */
    function getSpanOperation(){        
        if(formula != "cursor") {
            if( (formula != undefined) && (formula != '') ){
                switch(formula){
                    case 'mq-fraction mq-non-leaf':
                    case 'mq-non-leaf mq-fraction':
                        return getFractionXML(currentOperation);
                    case 'mq-scaled mq-paren':
                    case 'mq-paren mq-scaled':
                        return getParenXML(currentOperation);
                    // This just contains the sqrt bar, which we don't care about.
                    // We'll catch the important part on the next iteration
                    case 'mq-sqrt-prefix mq-scaled':
                    case 'mq-scaled mq-sqrt-prefix':
                        return '';
                    // This should come directly after the prefix
                    case 'mq-sqrt-stem mq-non-leaf':
                    case 'mq-non-leaf mq-sqrt-stem':
                        return getSqrtXML(currentOperation);
                    case 'mq-binary-operator':
                    case 'mq-unary-operator':
                        return setString(currentOperation, "operator");
                    // \vec and \hat will result in a non-leaf-node with two children that are
                    // a vector prefix containing the vector symbol, and a vector stem
                    // that contains the stuff under the vector symbol. We don't care about the symbol,
                    // so only grab the stuff under it
                    case 'mq-vector-prefix':
                    case 'mq-vector-hat-prefix':
                        return '';
                    case 'mq-vector-stem':
                        return getTopXML(currentOperation, 'arrow');
                    case 'mq-vector-hat-stem':
                        return getTopXML(currentOperation, 'hat');
                    case 'mq-overline mq-non-leaf':
                    case 'mq-non-leaf mq-overline':
                        return getTopXML(currentOperation, 'bar');
                    case 'mq-unit-vector':
                        return '<l><t>symbol</t><utf>' + unicodeUtil.convertCharToBold(currentOperation.text().charCodeAt(0)) + '</utf></l>';
                    case 'mq-nonSymbola':
                        return setString(currentOperation);
                    case 'mq-cursor':
                    case 'mq-cursor mq-blink':
                    case 'mq-blink mq-cursor':
                        return '';
                }
            } else {
                switch(currentOperation.text()){
                    case " ":
                    case "":
                        return setString(currentOperation, "space");
                    case "\u00a0":
                        return '<l><t>space</t><utf>32</utf></l>';
                    case "ln":
                        return setString(currentOperation, "ln");
                    case "log":
                        return setString(currentOperation, "log");
                    default:
                        return setString(currentOperation);
                }
            }
        }
    }

    /**
     * Returns the XML relating to a sqrt. It takes into account whether or not
     * this is a sqrt, or a nthroot
     */
    function getSqrtXML(currentOperation) {
        var parentNode = jQuery(currentOperation).parent();
        var nthRootNode = parentNode ? parentNode.prev() : null;
        var output = '';

        if (nthRootNode && !jQuery(nthRootNode).hasClass('mq-nthroot')) {
            output = '<r><t>square</t><rt></rt>';
        }

        return output + '<rd>' + getChildrenOperations(currentOperation) + '</rd></r>';
    }

    /**
     * Detect if the operation it's a fractions and what type of fraction: "standard" or "mixed"
     * 
     * @param object fraction
     * 
     * @returns string
     */
    function getFractionXML(fraction){
        var numerator = fraction.children('.mq-numerator');
        var denominator = fraction.children('.mq-denominator');
        
        return '<f>' + setFractionXML(numerator, denominator, "standard")  + '</f>';
        
        //TODO: I don't know how to set a fraction like "mixed" using the actual DOM
        //return "mixed";
    }
    
    /**
     * This method create the xml string for a fraction
     * 
     * @param object numerator
     * @param object denominator
     * @param string type
     * 
     * @returns string
     */
    function setFractionXML(numerator, denominator, type){
        return '<t>' + type + '</t><nm>' + getChildXML(numerator) + '</nm><dn>' + getChildXML(denominator) + '</dn>';
    }
    
    function getTopXML(top, type) {
        return '<top><t>' + type + '</t><b>' + getChildXML(top) + '</b></top>';
    }

    function getParenXML(node){
        var outputLocal = '';

        var paren = node.text();

        switch(paren){
            case '(':
                return '<g><t>paren</t><e>open</e><p>true</p><utf>40</utf></g>';
            case ')':
                return '<g><t>paren</t><e>close</e><p>true</p><utf>41</utf></g>';
            case '[':
                return '<g><t>bracket</t><e>open</e><p>true</p><utf>91</utf></g>';
            case ']':
                return '<g><t>bracket</t><e>close</e><p>true</p><utf>93</utf></g>';
            case '{':
                return '<g><t>brace</t><e>open</e><p>true</p><utf>123</utf></g>';
            case '}':
                return '<g><t>brace</t><e>close</e><p>true</p><utf>125</utf></g>';
            case '\u27E8': //mathematical left angle bracket
                return '<g><t>vbracket</t><e>open</e><p>true</p><utf>91</utf></g>';
            case '\u27E9': //mathematical right angle bracket
                return '<g><t>vbracket</t><e>close</e><p>true</p><utf>93</utf></g>';
            case '|':
                // Are we an opening | or a closing |? Well, this will be inside of a non-leaf node,
                // and we know that it will start and end with a | paren leaf. Thus, if there are no previous
                // nodes, then we must be an opening |. Otherwise, we're a closing |.
                if (!node.prev() || node.prev().length === 0) {
                    return '<abs><a>';
                }
                else {
                    return '</a></abs>';
                }
        }

        // oh oh how did I get here
        return 'undefined';
    }

    /**
     * This method runs through each children of an operations 
     * Detect what type of element is set the xml string o recall the getOperation method, 
     * to clean up the object until this found the var / number
     * 
     *  @param object currentOperation
     *  @param string typeOperation
     *  
     *  @returns String
     */
    function getChildXML(currentOperation, typeOperation){
        var localString = '';
        var childrenArray;

        switch(typeOperation)
        {
            case "group":
                childrenArray = currentOperation.children('.block').children();
                break;
            case "sqrt":
                childrenArray = currentOperation.children('.sqrt-stem').children();
                break;
            default:
                childrenArray = currentOperation.children();
                break;
        }

        jQuery.each(childrenArray, function(key, value){            
            if(jQuery(value).hasClass("cursor") == false){
                localString += getOperation(value);
            }
        });
        
        return localString;
    }
    
    /**
     * This method build the correct xml for each character, either a number, a char 
     * or a special operator
     *  
     * @param object literal
     * @param string type
     *  
     *  @returns String
     */
    function setString(literal, type){
        var literalNode = jQuery(literal);

        // We want to display the florin symbol (the fancy f) when the user enters
        // "f". However, we want to always grade it as if the user has entered a
        // regular "f".
        var isFlorin = literalNode.hasClass('mq-florin');

        var output = "";
        var value = isFlorin ? 'f' : literalNode.text();

        switch(type){
            case "operator":
            case "space":
                return '<l><t>'+type+'</t><utf>' + transformCharacter(value) + '</utf></l>';
            case "trig":
            case "ln":
            case "log":
                for (var i = 0; i < value.length; i++) {
                    output += '<l><t>'+type+'</t><utf>' + transformCharacter(value[i]) + '</utf></l>';
                };
                return output;
            case "NOSOLUTION":
                type = 'NO SOLUTION';
            case "UNDEFINED":
            case "NO SOLUTION":
            case "DNE":
                return '<cs><s>' + type + '</s><i>false</i></cs>';
            default:
                return '<l>' + getType(value) + '<utf>' + transformCharacter(value) + '</utf></l>';
        }    
    }
    

    /**
     * Detect in a string, ir a char it's a number, a char, 
     * a lower greek char or a upper greel char
     * 
     * @param char character
     * 
     * @returns string ('<t>var</t>' // '<t>number</t>', etc)
     */
    function getType(character){
        
        var patternNumber = /[0-9]+/g;
        var patternGreekLower = /[\u03B1-\u03D6]+/g;
        var patternGreekUpper = /[\u0391-\u03A9]+/g;
        var typeChar = ''
            
        if (character.match(patternNumber) != null){
            typeChar = '<t>number</t>';
        } else if(character.match(patternGreekLower) != null){
            typeChar = '<t>greek-lower</t>';
        } else if (character.match(patternGreekUpper) != null){
            typeChar = '<t>greek-upper</t>';
        } else if (jQuery.inArray(character, symbols) != -1) {
            typeChar = "<t>symbol</t>";
        } else {
            typeChar = '<t>var</t>';
        }
        
        return typeChar;
    }
    
    /**
     * This method convert each charater to a utf number
     * 
     * @param char character
     * 
     * @returns int
     */
    function transformCharacter(character){
        return character.charCodeAt(0);
    }
    
    return {
        /**
         * This method call the private method getXmlData 
         * to ceate the effect.
         * 
         * @param object data
         * 
         * @returns
         */
        getXmlData:function(data){
            return getXmlData(data);
        }
    };
};
