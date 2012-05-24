module('lively.morphic.StyleSheets').requires().toRun(function() {

    lively.morphic.Morph.addMethods(
        'stylesheets', {
            applyCSS: function() {
    var cssCode = this.get("CSSSource").textString;
    var morphName = this.get("MorphName").textString;
    
    var morph = $world.get(morphName);
    console.log(morph);
    if (morph){
        morph.setNodeId();
        morphId = morph.getNodeId();
        
        var specificCss = "#"+morphId+" { "+cssCode+" }";
        var styleTagId = "style-"+morphId;
        
        var styleNode = document.getElementById(styleTagId);
        console.log(styleNode);
        if(styleNode) {
            styleNode.parentNode.removeChild(styleNode);
        }
        
        var head = document.head;  
        var newStyleNode = document.createElement('style');
        newStyleNode.type = 'text/css';
        newStyleNode.id = styleTagId;
        var newStyleContent = document.createTextNode(specificCss);
        if (newStyleNode.styleSheet) {
            newStyleNode.styleSheet.cssText = newStyleContent.nodeValue;
        }
        else {
            newStyleNode.appendChild(newStyleContent);
        }
        head.appendChild(newStyleNode);

    }
    else {
        alert("Could not find morph '"+morphName+"' ...");
    }
        }
    )

}) // end of module