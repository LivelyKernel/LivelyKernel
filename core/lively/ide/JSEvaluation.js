module('lively.ide.JSEvaluation').requires('lively.ide.CodeEditor', 'lively.morphic.TextCore').toRun(function() {

// This module defines logic needed for evaluating JavaScript code and our own
// adaptations of the general JS semantic to make interactive code evaluations
// more user friendly

// FIXME: right now this only overwrites CodeEDitor/Text>>boundEval but should
// provide a proper eval interface in the future

lively.morphic.CodeEditor.addMethods({
    boundEval: function (__evalStatement) {
        // Evaluate the string argument in a context in which "this" is
        // determined by the reuslt of #getDoitContext
        var ctx = this.getDoitContext() || this,
            interactiveEval = function() {
                    var str = '"use strict";\n' + __evalStatement;
                    try {
                        var programNode = lively.ast.acorn.parse(str);
                    } catch (e) {
                        //Just in case the input is an object literal
                        //It must be a more than one property object,
                        //since the other ones are succesfully parsed (not as we intend).
                        //For the case of these more complex object literals,
                        //we only fix the top-level ones.
                        str = '"use strict";(\n' + __evalStatement + ')';
                        try {
                            lively.ast.acorn.parse(str);
                        } catch (e) {
                            //let eval throw the (original) exception
                            return eval('"use strict";\n' + __evalStatement);
                        }
                        //now the parse succeeded
                        return eval(str);
                    }
                    var ambiguousLiterals = [];
                    var iter1 = function(seq) {
                        while (seq.body.length > 0 && seq.body.last().type == 'BlockStatement') {
                            seq = seq.body.last();
                        }
                        var lastChild = seq.body.last();
                        if (!lastChild || lastChild.type == 'LabeledStatement') {
                            //if the value to return is an empty or a one-property Object literal,
                            //it is interpreted as a block statement.
                            //To make it work we will have to surround it by round braces
                            ambiguousLiterals.push(seq);
                        } else if (lastChild.type == 'IfStatement') {
                            var iter2 = function(ifNode) {
                                while (ifNode.consequent.type == 'IfStatement') {
                                    ifNode = ifNode.consequent;
                                }
                                if (ifNode.consequent.type == 'BlockStatement' && 
                                    ifNode.consequent.body.length > 0) {
                                        //When deciding what the expected return value of an 
                                        //if statement should be,
                                        //we do not interpret the curly braces construct in
                                        //"if(expr) {}" as an object literal,
                                        //since it is not at all obvious that that's what
                                        //the user intends in this case. 
                                        //Instead, we let eval do its thing, 
                                        //so, if expr is truish, we return undefined.
                                        //
                                        //But for "if(expr) {prop: val}" we guess that
                                        //the user does expect an object instead of val
                                        //when expr is truish, so we "fix" it
                                        iter1(ifNode.consequent);
                                }
                                if (ifNode.alternate) {
                                    if(ifNode.alternate.type == 'BlockStatement' && 
                                        ifNode.alternate.body.length > 0) {
                                            iter1(ifNode.alternate);
                                    } else if (ifNode.alternate.type == 'IfStatement') {
                                        iter2(ifNode.alternate);
                                    }
                                }
                            }
                            iter2(lastChild);
                        }
                    }
                    iter1(programNode);
                    while (ambiguousLiterals.length > 0) {
                        var node = ambiguousLiterals.pop();
                        str = str.substring(0, node.start) + '(' +
                                str.substring(node.start, node.end) +
                                ')' + str.substring(node.end);
                    }
                    return eval(str);
                };
        return interactiveEval.call(ctx);
    }
});

lively.morphic.Text.addMethods({
    boundEval: function (__evalStatement) {
        // Evaluate the string argument in a context in which "this" is
        // determined by the reuslt of #getDoitContext
        var ctx = this.getDoitContext() || this,
            interactiveEval = function() {
                    var str = '"use strict";\n' + __evalStatement;
                    try {
                        var programNode = lively.ast.acorn.parse(str);
                    } catch (e) {
                        //Just in case the input is an object literal
                        //It must be a more than one property object,
                        //since the other ones are succesfully parsed (not as we intend).
                        //For the case of these more complex object literals,
                        //we only fix the top-level ones.
                        str = '"use strict";(\n' + __evalStatement + ')';
                        try {
                            lively.ast.acorn.parse(str);
                        } catch (e) {
                            //let eval throw the (original) exception
                            return eval('"use strict";\n' + __evalStatement);
                        }
                        //now the parse succeeded
                        return eval(str);
                    }
                    var ambiguousLiterals = [];
                    var iter1 = function(seq) {
                        while (seq.body.length > 0 && seq.body.last().type == 'BlockStatement') {
                            seq = seq.body.last();
                        }
                        var lastChild = seq.body.last();
                        if (!lastChild || lastChild.type == 'LabeledStatement') {
                            //if the value to return is an empty or a one-property Object literal,
                            //it is interpreted as a block statement.
                            //To make it work we will have to surround it by round braces
                            ambiguousLiterals.push(seq);
                        } else if (lastChild.type == 'IfStatement') {
                            var iter2 = function(ifNode) {
                                while (ifNode.consequent.type == 'IfStatement') {
                                    ifNode = ifNode.consequent;
                                }
                                if (ifNode.consequent.type == 'BlockStatement' && 
                                    ifNode.consequent.body.length > 0) {
                                        //When deciding what the expected return value of an 
                                        //if statement should be,
                                        //we do not interpret the curly braces construct in
                                        //"if(expr) {}" as an object literal,
                                        //since it is not at all obvious that that's what
                                        //the user intends in this case. 
                                        //Instead, we let eval do its thing, 
                                        //so, if expr is truish, we return undefined.
                                        //
                                        //But for "if(expr) {prop: val}" we guess that
                                        //the user does expect an object instead of val
                                        //when expr is truish, so we "fix" it
                                        iter1(ifNode.consequent);
                                }
                                if (ifNode.alternate) {
                                    if(ifNode.alternate.type == 'BlockStatement' && 
                                        ifNode.alternate.body.length > 0) {
                                            iter1(ifNode.alternate);
                                    } else if (ifNode.alternate.type == 'IfStatement') {
                                        iter2(ifNode.alternate);
                                    }
                                }
                            }
                            iter2(lastChild);
                        }
                    }
                    iter1(programNode);
                    while (ambiguousLiterals.length > 0) {
                        var node = ambiguousLiterals.pop();
                        str = str.substring(0, node.start) + '(' +
                                str.substring(node.start, node.end) +
                                ')' + str.substring(node.end);
                    }
                    return eval(str);
                };
        return interactiveEval.call(ctx);
    }
});

}) // end of module