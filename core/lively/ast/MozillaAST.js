module('lively.ast.MozillaAST').requires().toRun(function() {

lively.ast.MozillaAST.Cache = {
    // this is generated via lively.ast.MozillaAST.SpiderMonkeyParserAPI.createNodeSpecs
    enums: [
      "enum UnaryOperator {\n"
    + "    \"-\" | \"+\" | \"!\" | \"~\" | \"typeof\" | \"void\" | \"delete\"\n"
    + "}",
      "enum BinaryOperator {\n"
    + "    \"==\" | \"!=\" | \"===\" | \"!==\"\n"
    + "         | \"<\" | \"<=\" | \">\" | \">=\"\n"
    + "         | \"<<\" | \">>\" | \">>>\"\n"
    + "         | \"+\" | \"-\" | \"*\" | \"/\" | \"%\"\n"
    + "         | \"|\" | \"^\" | \"&\" | \"in\"\n"
    + "         | \"instanceof\" | \"..\"\n"
    + "}",
      "enum LogicalOperator {\n"
    + "    \"||\" | \"&&\"\n"
    + "}",
      "enum AssignmentOperator {\n"
    + "    \"=\" | \"+=\" | \"-=\" | \"*=\" | \"/=\" | \"%=\"\n"
    + "        | \"<<=\" | \">>=\" | \">>>=\"\n"
    + "        | \"|=\" | \"^=\" | \"&=\"\n"
    + "}",
      "enum UpdateOperator {\n"
    + "    \"++\" | \"--\"\n"
    + "}"],

    interfaces: [
        "interface Node {\n"
      + "    type: string;\n"
      + "    loc: SourceLocation | null;\n"
      + "}",
        "interface SourceLocation {\n"
      + "    source: string | null;\n"
      + "    start: Position;\n"
      + "    end: Position;\n"
      + "}",
        "interface Position {\n"
      + "    line: uint32 >= 1;\n"
      + "    column: uint32 >= 0;\n"
      + "}",
        "interface Program <: Node {\n"
      + "    type: \"Program\";\n"
      + "    body: [ Statement ];\n"
      + "}",
        "interface Function <: Node {\n"
      + "    id: Identifier | null;\n"
      + "    params: [ Pattern ];\n"
      + "    defaults: [ Expression ] | null;\n"
      + "    rest: Identifier | null;\n"
      + "    body: BlockStatement | Expression;\n"
      + "    generator: boolean;\n"
      + "    expression: boolean;\n"
      + "}",
        "interface Statement <: Node { }\n",
        "interface EmptyStatement <: Statement {\n"
      + "    type: \"EmptyStatement\";\n"
      + "}",
        "interface BlockStatement <: Statement {\n"
      + "    type: \"BlockStatement\";\n"
      + "    body: [ Statement ];\n"
      + "}",
        "interface ExpressionStatement <: Statement {\n"
      + "    type: \"ExpressionStatement\";\n"
      + "    expression: Expression;\n"
      + "}",
        "interface IfStatement <: Statement {\n"
      + "    type: \"IfStatement\";\n"
      + "    test: Expression;\n"
      + "    consequent: Statement;\n"
      + "    alternate: Statement | null;\n"
      + "}",
        "interface LabeledStatement <: Statement {\n"
      + "    type: \"LabeledStatement\";\n"
      + "    label: Identifier;\n"
      + "    body: Statement;\n"
      + "}",
        "interface BreakStatement <: Statement {\n"
      + "    type: \"BreakStatement\";\n"
      + "    label: Identifier | null;\n"
      + "}",
        "interface ContinueStatement <: Statement {\n"
      + "    type: \"ContinueStatement\";\n"
      + "    label: Identifier | null;\n"
      + "}",
        "interface WithStatement <: Statement {\n"
      + "    type: \"WithStatement\";\n"
      + "    object: Expression;\n"
      + "    body: Statement;\n"
      + "}",
        "interface SwitchStatement <: Statement {\n"
      + "    type: \"SwitchStatement\";\n"
      + "    discriminant: Expression;\n"
      + "    cases: [ SwitchCase ];\n"
      + "    lexical: boolean;\n"
      + "}",
        "interface ReturnStatement <: Statement {\n"
      + "    type: \"ReturnStatement\";\n"
      + "    argument: Expression | null;\n"
      + "}",
        "interface ThrowStatement <: Statement {\n"
      + "    type: \"ThrowStatement\";\n"
      + "    argument: Expression;\n"
      + "}",
        "interface TryStatement <: Statement {\n"
      + "    type: \"TryStatement\";\n"
      + "    block: BlockStatement;\n"
      + "    handler: CatchClause | null;\n"
      + "    guardedHandlers: [ CatchClause ];\n"
      + "    finalizer: BlockStatement | null;\n"
      + "}",
        "interface WhileStatement <: Statement {\n"
      + "    type: \"WhileStatement\";\n"
      + "    test: Expression;\n"
      + "    body: Statement;\n"
      + "}",
        "interface DoWhileStatement <: Statement {\n"
      + "    type: \"DoWhileStatement\";\n"
      + "    body: Statement;\n"
      + "    test: Expression;\n"
      + "}",
        "interface ForStatement <: Statement {\n"
      + "    type: \"ForStatement\";\n"
      + "    init: VariableDeclaration | Expression | null;\n"
      + "    test: Expression | null;\n"
      + "    update: Expression | null;\n"
      + "    body: Statement;\n"
      + "}",
        "interface ForInStatement <: Statement {\n"
      + "    type: \"ForInStatement\";\n"
      + "    left: VariableDeclaration |  Expression;\n"
      + "    right: Expression;\n"
      + "    body: Statement;\n"
      + "    each: boolean;\n"
      + "}",
        "interface ForOfStatement <: Statement {\n"
      + "    type: \"ForOfStatement\";\n"
      + "    left: VariableDeclaration |  Expression;\n"
      + "    right: Expression;\n"
      + "    body: Statement;\n"
      + "}",  "interface LetStatement <: Statement {\n"
        + "    type: \"LetStatement\";\n"
      + "    head: [ { id: Pattern, init: Expression | null } ];\n"
      + "    body: Statement;\n"
      + "}",
        "interface DebuggerStatement <: Statement {\n"
      + "    type: \"DebuggerStatement\";\n"
      + "}",
        "interface Declaration <: Statement { }\n",
      "interface FunctionDeclaration <: Function, Declaration {\n"
      + "    type: \"FunctionDeclaration\";\n"
      + "    id: Identifier;\n"
      + "    params: [ Pattern ];\n"
      + "    defaults: [ Expression ] | null;\n"
      + "    rest: Identifier | null;\n"
      + "    body: BlockStatement | Expression;\n"
      + "    generator: boolean;\n"
      + "    expression: boolean;\n"
      + "}",
        "interface VariableDeclaration <: Declaration {\n"
      + "    type: \"VariableDeclaration\";\n"
      + "    declarations: [ VariableDeclarator ];\n"
      + "    kind: \"var\" | \"let\" | \"const\";\n"
      + "}",
        "interface VariableDeclarator <: Node {\n"
      + "    type: \"VariableDeclarator\";\n"
      + "    id: Pattern;\n"
      + "    init: Expression | null;\n"
      + "}",
        "interface Expression <: Node, Pattern { }",  "interface ThisExpression <: Expression {\n"
      + "    type: \"ThisExpression\";\n"
      + "}",
        "interface ArrayExpression <: Expression {\n"
      + "    type: \"ArrayExpression\";\n"
      + "    elements: [ Expression | null ];\n"
      + "}",  "interface ObjectExpression <: Expression {\n"
        + "    type: \"ObjectExpression\";\n"
      + "    properties: [ { key: Literal | Identifier,\n"
      + "                    value: Expression,\n"
      + "                    kind: \"init\" | \"get\" | \"set\" } ];\n"
      + "}",  "interface FunctionExpression <: Function, Expression {\n"
        + "    type: \"FunctionExpression\";\n"
      + "    id: Identifier | null;\n"
      + "    params: [ Pattern ];\n"
      + "    defaults: [ Expression ] | null;\n"
      + "    rest: Identifier | null;\n"
      + "    body: BlockStatement | Expression;\n"
      + "    generator: boolean;\n"
      + "    expression: boolean;\n"
      + "}",
        "interface ArrowExpression <: Function, Expression {\n"
      + "    type: \"ArrowExpression\";\n"
      + "    params: [ Pattern ];\n"
      + "    defaults: [ Expression ] | null;\n"
      + "    rest: Identifier | null;\n"
      + "    body: BlockStatement | Expression;\n"
      + "    generator: boolean;\n"
      + "    expression: boolean;\n"
      + "}",
        "interface SequenceExpression <: Expression {\n"
      + "    type: \"SequenceExpression\";\n"
      + "    expressions: [ Expression ];\n"
      + "}",  "interface UnaryExpression <: Expression {\n"
        + "    type: \"UnaryExpression\";\n"
      + "    operator: UnaryOperator;\n"
      + "    prefix: boolean;\n"
      + "    argument: Expression;\n"
      + "}",  "interface BinaryExpression <: Expression {\n"
        + "    type: \"BinaryExpression\";\n"
      + "    operator: BinaryOperator;\n"
      + "    left: Expression;\n"
      + "    right: Expression;\n"
      + "}",  "interface AssignmentExpression <: Expression {\n"
        + "    type: \"AssignmentExpression\";\n"
      + "    operator: AssignmentOperator;\n"
      + "    left: Expression;\n"
      + "    right: Expression;\n"
      + "}",  "interface UpdateExpression <: Expression {\n"
        + "    type: \"UpdateExpression\";\n"
      + "    operator: UpdateOperator;\n"
      + "    argument: Expression;\n"
      + "    prefix: boolean;\n"
      + "}",  "interface LogicalExpression <: Expression {\n"
        + "    type: \"LogicalExpression\";\n"
      + "    operator: LogicalOperator;\n"
      + "    left: Expression;\n"
      + "    right: Expression;\n"
      + "}",  "interface ConditionalExpression <: Expression {\n"
        + "    type: \"ConditionalExpression\";\n"
      + "    test: Expression;\n"
      + "    alternate: Expression;\n"
      + "    consequent: Expression;\n"
      + "}",  "interface NewExpression <: Expression {\n"
        + "    type: \"NewExpression\";\n"
      + "    callee: Expression;\n"
      + "    arguments: [ Expression ];\n"
      + "}",  "interface CallExpression <: Expression {\n"
        + "    type: \"CallExpression\";\n"
      + "    callee: Expression;\n"
      + "    arguments: [ Expression ];\n"
      + "}",  "interface MemberExpression <: Expression {\n"
        + "    type: \"MemberExpression\";\n"
      + "    object: Expression;\n"
      + "    property: Identifier | Expression;\n"
      + "    computed: boolean;\n"
      + "}",  "interface YieldExpression <: Expression {\n"
        + "    argument: Expression | null;\n"
      + "}",
        "interface ComprehensionExpression <: Expression {\n"
      + "    body: Expression;\n"
      + "    blocks: [ ComprehensionBlock ];\n"
      + "    filter: Expression | null;\n"
      + "}",
        "interface GeneratorExpression <: Expression {\n"
      + "    body: Expression;\n"
      + "    blocks: [ ComprehensionBlock ];\n"
      + "    filter: Expression | null;\n"
      + "}",
        "interface GraphExpression <: Expression {\n"
      + "    index: uint32;\n"
      + "    expression: Literal;\n"
      + "}",
        "interface GraphIndexExpression <: Expression {\n"
      + "    index: uint32;\n"
      + "}",
        "interface LetExpression <: Expression {\n"
      + "    type: \"LetExpression\";\n"
      + "    head: [ { id: Pattern, init: Expression | null } ];\n"
      + "    body: Expression;\n"
      + "}",
        "interface Pattern <: Node { }\n",
      "interface ObjectPattern <: Pattern {\n"
      + "    type: \"ObjectPattern\";\n"
      + "    properties: [ { key: Literal | Identifier, value: Pattern } ];\n"
      + "}",
        "interface ArrayPattern <: Pattern {\n"
      + "    type: \"ArrayPattern\";\n"
      + "    elements: [ Pattern | null ];\n"
      + "}",
        "interface SwitchCase <: Node {\n"
      + "    type: \"SwitchCase\";\n"
      + "    test: Expression | null;\n"
      + "    consequent: [ Statement ];\n"
      + "}",
        "interface CatchClause <: Node {\n"
      + "    type: \"CatchClause\";\n"
      + "    param: Pattern;\n"
      + "    guard: Expression | null;\n"
      + "    body: BlockStatement;\n"
      + "}",
        "interface ComprehensionBlock <: Node {\n"
      + "    left: Pattern;\n"
      + "    right: Expression;\n"
      + "    each: boolean;\n"
      + "}",
        "interface Identifier <: Node, Expression, Pattern {\n"
      + "    type: \"Identifier\";\n"
      + "    name: string;\n"
      + "}",
        "interface Literal <: Node, Expression {\n"
      + "    type: \"Literal\";\n"
      + "    value: string | boolean | null | number | RegExp;\n"
      + "}",
        "interface XMLDefaultDeclaration <: Declaration {\n"
      + "    type: \"XMLDefaultDeclaration\";\n"
      + "    namespace: Expression;\n"
      + "}",
        "interface XMLAnyName <: Expression {\n"
      + "    type: \"XMLAnyName\";\n"
      + "}",
        "interface XMLQualifiedIdentifier <: Expression {\n"
      + "    type: \"XMLQualifiedIdentifier\";\n"
      + "    left: Identifier | XMLAnyName;\n"
      + "    right: Identifier | Expression;\n"
      + "    computed: boolean;\n"
      + "}",
        "interface XMLFunctionQualifiedIdentifier <: Expression {\n"
      + "    type: \"XMLFunctionQualifiedIdentifier\";\n"
      + "    right: Identifier | Expression;\n"
      + "    computed: boolean;\n"
      + "}",
        "interface XMLAttributeSelector <: Expression {\n"
      + "    type: \"XMLAttributeSelector\";\n"
      + "    attribute: Expression;\n"
      + "}",
        "interface XMLFilterExpression <: Expression {\n"
      + "    type: \"XMLFilterExpression\";\n"
      + "    left: Expression;\n"
      + "    right: Expression;\n"
      + "}",
        "interface XMLElement <: XML, Expression {\n"
      + "    type: \"XMLElement\";\n"
      + "    contents: [ XML ];\n"
      + "}",
        "interface XMLList <: XML, Expression {\n"
      + "    type: \"XMLList\";\n"
      + "    contents: [ XML ];\n"
      + "}",
        "interface XML <: Node { }\n",
      "interface XMLEscape <: XML {\n"
      + "    type \"XMLEscape\";\n"
      + "    expression: Expression;\n"
      + "}",
        "interface XMLText <: XML {\n"
      + "    type: \"XMLText\";\n"
      + "    text: string;\n"
      + "}",
        "interface XMLStartTag <: XML {\n"
      + "    type: \"XMLStartTag\";\n"
      + "    contents: [ XML ];\n"
      + "}",
        "interface XMLEndTag <: XML {\n"
      + "    type: \"XMLEndTag\";\n"
      + "    contents: [ XML ];\n"
      + "}",
        "interface XMLPointTag <: XML {\n"
      + "    type: \"XMLPointTag\";\n"
      + "    contents: [ XML ];\n"
      + "}",
        "interface XMLName <: XML {\n"
      + "    type: \"XMLName\";\n"
      + "    contents: string | [ XML ];\n"
      + "}",
        "interface XMLAttribute <: XML {\n"
      + "    type: \"XMLAttribute\";\n"
      + "    value: string;\n"
      + "}",
        "interface XMLCdata <: XML {\n"
      + "    type: \"XMLCdata\";\n"
      + "    contents: string;\n"
      + "}",
        "interface XMLComment <: XML {\n"
      + "    type: \"XMLComment\";\n"
      + "    contents: string;\n"
      + "}",
        "interface XMLProcessingInstruction <: XML {\n"
      + "    type: \"XMLProcessingInstruction\";\n"
      + "    target: string;\n"
      + "    contents: string | null;\n"
      + "}"]

}

lively.ast.MozillaAST.SpecHelper = {

    findNodeSpec: function(nodeSpecs, name) {
        // lively.ast.MozillaAST.SpecHelper.findNodeSpec(parsed, 'Node')
        // lively.ast.MozillaAST.SpecHelper.findNodeSpec(parsed, 'ObjectPattern')
        return nodeSpecs.detect(function(ea) {
            return ea.name === name; });
    },

    inherits: function(nodeSpecs, superNodeSpec, nodeSpec) {
        // lively.ast.MozillaAST.SpecHelper.inherits(parsed, 'Node', 'Pattern')
        // lively.ast.MozillaAST.SpecHelper.inherits(parsed, 'Node', ea)
        // lively.ast.MozillaAST.SpecHelper.inherits(parsed, 'Node', 'ObjectPattern')
        // lively.ast.MozillaAST.SpecHelper.inherits(parsed, 'Pattern', 'ObjectPattern')
        // lively.ast.MozillaAST.SpecHelper.inherits(parsed, 'ComprehensionBlock', 'ObjectPattern')
        if (typeof nodeSpec === 'string') nodeSpec = lively.ast.MozillaAST.SpecHelper.findNodeSpec(nodeSpecs,nodeSpec);
        if (typeof superNodeSpec === 'string') superNodeSpec = lively.ast.MozillaAST.SpecHelper.findNodeSpec(nodeSpecs,superNodeSpec);
        if (!nodeSpec.supers || !nodeSpec.supers.length) return false;
        if (nodeSpec.supers.include(superNodeSpec.name)) return true;
        return nodeSpec.supers
            .map(lively.ast.MozillaAST.SpecHelper.findNodeSpec.curry(nodeSpecs)).compact()
            .any(lively.ast.MozillaAST.SpecHelper.inherits.curry(nodeSpecs, superNodeSpec));
    }

}

lively.ast.MozillaAST.SpiderMonkeyParserAPI = {

    ensureSpecParser: function() {
        // delete Global.MozillaNodeSpecParser
        if (typeof MozillaNodeSpecParser !== 'undefined') return MozillaNodeSpecParser;
        var src = "ometa MozillaNodeSpecParser {\n"
        + "    name = spaces (letter | digit | '_' | '$')+:cs -> cs.join(''),\n"
        + "    enum = \"enum\" name:n spaces fromTo('{','}'):b -> {name:n, body:b.replace(/^\\{|\\}$/g, '').trim()},\n"
        + "    interface = \"interface\" name:i superInterfaces?:si members:ms -> {name: i, supers: si, members: ms},\n"
        + "    superInterfaces = spaces \"<:\" listOf(#name, ','):ns -> ns,\n"
        + "    members = \"{\" spaces (~\"}\" member:m -> m)*:ms \"}\" -> ms,\n"
        + "    member = name:k ':' memberValue:vs memberEnd -> {key: k, choices: vs},\n"
        + "    memberEnd = spaces ';' spaces,\n"
        + "    memberValue = listOf(#plainMember, '|'):cs,\n"
        + "    plainMember = spaces (nullMember | stringConstant | specificTypeMember | objectMember | arrayMember | nodeMember):m spaces -> m,\n"
        + "    stringConstant = '\"' name:n '\"' -> {type: 'string', value: n},\n"
        + "    specificTypeMember = lower+:n  -> {type: 'specificType', value: n.join('')},\n"
        + "    objectMember = '{' listOf(#objectMemberMember, ','):ms '}' -> {type: 'object', fields: ms},\n"
        + "    objectMemberMember = name:k ':' memberValue:v -> {key: k, value: v},\n"
        + "    arrayMember = '[' memberValue:ms ']' -> {type: 'array', values: ms},\n"
        + "    nullMember = \"null\" -> {type: 'null'},\n"
        + "    nodeMember = firstAndRest(#upper, #letter):n -> {type: 'node', value: n.join('')}\n"
        + "}\n";
        return OMetaSupport.ometaEval(src);
    },

    withDocument: function(thenDo) {
        // SpiderMonkeyParserAPI.withDocument(function(err, doc) { show(Exporter.stringify(doc)); })
        function parseHTML(markup) {
        	var doc = document.implementation.createHTMLDocument("");
          	if (markup.toLowerCase().indexOf('<!doctype') > -1) {
        		doc.documentElement.innerHTML = markup;
          	} else {
        		doc.body.innerHTML = markup;
          	}
            return doc;
        }

        var url = "https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API";
        new WebResource(url).beAsync().get().whenDone(function(content, status) {
            if (!status.isSuccess()) { thenDo(status, null); return; }
            var res, err;
            try { res = parseHTML(content); } catch (e) { err = e; }
            thenDo(err, res);
        });
    },

    filterParserAPI: function(kind, specDocument) {
        // from all the stuff defined in the Parser_API spec we just filter out
        // the kind specs, e.g. "interface" or "enum"
        return lively.$(doc).find('pre').toArray()
                .pluck('textContent')
                .map(function(ea) { return ea.replace(/ /g, ' '); })
                .filter(function(ea) { return ea.startsWith(kind); });
    },

    filterParserAPIInterfaces: function(specDocument) {
        return lively.ast.MozillaAST.SpiderMonkeyParserAPI.filterParserAPI('interface', specDocument);
    },

    filterParserAPIEnums: function(specDocument) {
        return lively.ast.MozillaAST.SpiderMonkeyParserAPI.filterParserAPI('enum', specDocument);
    },

    createEnumSpecs: function(enumDefs) {
        return enumDefs.map(function(ea) {
            return OMetaSupport.matchAllWithGrammar(MozillaNodeSpecParser, 'enum', ea);
        });
    },

    createNodeSpecs: function(interfaceDefs) {
        // parse the spec definitions from developer.mozilla.org. Only parses
        // and returns the interface definitions for JavaScript nodes
        // they have the form: {
        //   name: STRING, -- interface name
        //   supers: [STRING], -- names of interfaces this interface inherits from
        //   members: [OBJECT] -- the attributes this interface provides
        // }
        // a member object has the form: {
        //   key: STRING, -- name of the attribute
        //   choices: [{
        //     type: 'string'|'specificType'|'object'|'array'|'null'|'node',
        //     [value: OBJECT|STRING]
        //   }]
        var parser = this.ensureSpecParser();
        var allParsed = interfaceDefs
                .map(function(ea) { return OMetaSupport.matchAllWithGrammar(parser, 'interface', ea); })
                .reject(function(ea) { return Object.isString(ea); })
                .reject(function(ea) { return ea.name.match(/^XML/); }),
            parsed = allParsed.filter(function(ea) { return lively.ast.MozillaAST.SpecHelper.inherits(allParsed, 'Node', ea); })
        
        // each nodeSpec also has a "type" memeber (same as nodeSpec.name), filter that out
        parsed.forEach(function(ea) {
            ea.members = ea.members.filter(function(memberSpec) { return memberSpec.key !== 'type'; })
        });
        return parsed;
    }

}

lively.ast.MozillaAST.NodeSpecVisitorGenerator = {

    singleIndent: '    ',

    printMemberArrayCode: function(options, arrayPropName, arrayMember, iteratorName, indent) {
        var f = Strings.format,
            singleIndent = lively.ast.MozillaAST.NodeSpecVisitorGenerator.singleIndent,
            parameterString = options.parameters && options.parameters.length ? (', ' + options.parameters.join(', ')) : '',
            returnAssignment = options.useReturn ? 'retVal = ' : '';;
        var values = arrayMember.values,
            types = values.pluck('type'),
            canBeNull = types.include('null'),
            code = '';
        if (canBeNull) { code += f('%sif (%s) {\n', indent, iteratorName); indent += singleIndent; }
        if (types.without('null').length !== 1) {
            throw new Error('Invalid array member: ' + Objects.inspect(arrayMember, {maxDepth: 3}));
        } else  if (types[0] === 'node') {
            var path = options.pathAsParameter ? ', ["' + arrayPropName + '", i]' : '';
            code += f('%s// %s %s of type %s\n',
                indent, iteratorName, canBeNull ? "can be" : "is", values.pluck('value').join(' or '));
            code += f("%s%sthis.accept(%s%s%s);\n",
                indent, returnAssignment, iteratorName, parameterString, path);
        } else if (types[0] === 'object') {
            if (arrayMember.values.length !== 1)
                throw new Error('Array member has more than one object value?');
            var objSpec = arrayMember.values[0];
            objSpec.fields.forEach(function(fieldSpec) {
                var fieldTypes = fieldSpec.value.pluck('type').uniq();
                var fieldCanBeNull = fieldTypes.include('null');
                if (fieldCanBeNull) { code += f('%sif (%s.%s) {\n', indent, iteratorName, fieldSpec.key); indent += singleIndent; fieldTypes.remove('null'); }
                if (fieldTypes.length !== 1)
                    throw new Error('Array member\'s object value has a field with differing types!');
                if (fieldTypes[0] === 'string') {
                    code += f('%s// %s.%s is %s\n', indent,
                        iteratorName, fieldSpec.key,
                        fieldSpec.value.pluck('value').map(Strings.print).join(' or '))
                } else if (fieldTypes[0] === 'node') {
                    var path = options.pathAsParameter ? ', ["' + arrayPropName + '", i, "' + fieldSpec.key + '"]' : '';
                    code += f('%s// %s.%s %s of type %s\n',
                        indent, iteratorName, fieldSpec.key, fieldCanBeNull ? "can be" : "is", fieldTypes.join(' or '));
                    code += f('%s%sthis.accept(%s.%s%s%s);\n',
                        indent, returnAssignment, iteratorName, fieldSpec.key, parameterString, path);
                }
                if (fieldCanBeNull) { indent = indent.slice(0, -singleIndent.length); code += f('%s}\n', indent); }
            });
        } else {
            throw new Error('Invalid array member: ' + Objects.inspect(arrayMember, {maxDepth: 3}));
        }
        if (canBeNull) { indent = indent.slice(0,-singleIndent.length); code += f('%s}\n', indent); }
        return code;
    },

    printMemberCode: function(options, indent, enumSpecs, memberSpec) {
        var code = '',
            f = Strings.format,
            singleIndent = lively.ast.MozillaAST.NodeSpecVisitorGenerator.singleIndent,
            parameterString = options.parameters && options.parameters.length ? (', ' + options.parameters.join(', ')) : '',
            returnAssignment = options.useReturn ? 'retVal = ' : '';
        var nullChoice = memberSpec.choices.detect(function(ea) { return ea.type === 'null'; }),
            choices = memberSpec.choices.without(nullChoice),
            choiceTypes = choices.pluck('type').uniq(),
            canBeNull = !!nullChoice;
        // not all "node" types are actual nodes, there are also enums
        var nodeExceptions = enumSpecs.pluck('name'),
            isEnum = choiceTypes.include('node') && nodeExceptions.intersect(choices.pluck('value')).length > 0;

        // 1. null guard
        if (canBeNull) { code += f("%sif (node.%s) {\n", indent, memberSpec.key); indent += singleIndent; }
        // 2. choices
        if (choiceTypes[0] === 'string') {
            code += f('%s// node.%s is %s\n', indent,
                memberSpec.key,
                choices.pluck('value').map(Strings.print).join(' or '));
        } else if (choiceTypes[0] === 'specificType') {
            var specificTypes = choices.pluck('value');
            code += f('%s// node.%s has a specific type that is %s\n', indent,
                memberSpec.key, specificTypes.join(' or '));
            if (specificTypes.length === 1 && specificTypes[0] === 'boolean') {
                code += f("%sif (node.%s) {/*do stuff*/}\n", indent, memberSpec.key);
            }
        } else if (isEnum) {
            var enumNames = choices.pluck('value');
            if (enumNames.length !== 1) throw new Error('Expecting a single enum ' + enumNames);
            var enumS = enumSpecs.detect(function(ea) { return ea.name === enumNames[0]; });
            code += f('%s// node.%s is an %s enum:\n%s// %s\n',
                indent, memberSpec.key, enumS.name,
                indent, enumS.body.split('\n').invoke('trim').join(' | '));
        } else if (choiceTypes.include('node')) {
            if (choiceTypes.length === 1) {
                code += f("%s// %s is a node of type %s\n", indent, memberSpec.key, choices[0].value);
            } else {
                code += f("%s// %s %s\n", indent, memberSpec.key, 'can be ' + choiceTypes.join(' or '));
            }
            var path = options.pathAsParameter ? ', ["' + memberSpec.key + '"]' : '';
            code += f('%s%sthis.accept(node.%s%s%s);\n',
                indent, returnAssignment, memberSpec.key, parameterString, path);
        } else if (choiceTypes.include('array')) {
            var index = options.pathAsParameter ? ', i' : '';
            code += f('%snode.%s.forEach(function(ea%s) {\n%s%s}, this);\n',
                indent, memberSpec.key,
                index,
                choices.map(function(ea) {
                    return lively.ast.MozillaAST.NodeSpecVisitorGenerator.printMemberArrayCode(options, memberSpec.key, ea, 'ea', indent + singleIndent); })
                        .join('\n' + indent),
                indent);
        }
        if (canBeNull) { indent = indent.slice(0,-(singleIndent.length));  code += f("%s}\n", indent); }
        return code;
    },

    printNodeSpec: function(options, enumSpecs, nodeSpec) {
        var f = Strings.format,
            methodName = 'visit' + nodeSpec.name.capitalize(),
            singleIndent = lively.ast.MozillaAST.NodeSpecVisitorGenerator.singleIndent,
            indent = singleIndent,
            parameterString = options.parameters && options.parameters.length ? (', ' + options.parameters.join(', ')) : '',
            pathParam = options.pathAsParameter ? ', path' : '',
            returnDeclaration = options.useReturn ? indent + singleIndent + 'var retVal;\n' : '',
            returnStmt = options.useReturn ? indent + singleIndent + 'return retVal;\n' : '',
            memberPrint = lively.ast.MozillaAST.NodeSpecVisitorGenerator.printMemberCode.curry(options, indent + singleIndent, enumSpecs);
        return f('%s%s: function(node%s%s) {\n%s%s%s%s}',
            indent, methodName,
            parameterString,
            pathParam,
            returnDeclaration,
            nodeSpec.members.map(memberPrint).join('\n'),
            returnStmt,
            indent);
    },

    printCreation: function(options) {
        return Strings.format("\n// This code was generated with:\n// lively.ast.MozillaAST.createVisitorCode({%s});",
                Object.getOwnPropertyNames(options).map(function(key) {
                  return key + ': ' + Strings.print(options[key]); }).join(', '));
    },

    printVisitorSpec: function(options, nodeSpecs, enumSpecs) {
        var singleIndent = lively.ast.MozillaAST.NodeSpecVisitorGenerator.singleIndent,
            creationComment = this.printCreation(options),
            parameterString = options.parameters && options.parameters.length ? (', ' + options.parameters.join(', ')) : '',
            pathParam = options.pathAsParameter ? ', path' : '',
            acceptMethod = Strings.format("%saccept: function(node%s%s) {\n%sreturn this['visit' + node.type](node%s%s);\n%s}",
                singleIndent,
                parameterString,
                pathParam,
                singleIndent+singleIndent,
                parameterString,
                pathParam,
                singleIndent),
            visitorMethods = nodeSpecs.map(lively.ast.MozillaAST.NodeSpecVisitorGenerator.printNodeSpec.curry(options, enumSpecs)),
            methods = [acceptMethod].concat(visitorMethods);
        return options.asLivelyClass ?
            Strings.format('Object.subclass("%s",%s\n"visiting", {\n%s\n});', options.name, creationComment, methods.join(',\n\n')) :
            Strings.format('%s = {\n%s\n};', options.name, methods.join(',\n\n'));
    }

}

Object.extend(lively.ast.MozillaAST, {

    createVisitorCode: function(options, thenDo) {
        // USAGE:
        // lively.ast.MozillaAST.createVisitorCode(options, optionalCallback);
        // optionalCallback = function(err, sourceCode) { /*...*/ }
        // options = {
        //   loadFromMozillaPage: BOOL, -- reload spec from developer.mozilla.org,
        //   openWindow: BOOL, -- open generated code in a window
        //   asLivelyClass: BOOL, -- generate visitor as a lively class
        //   name: STRING, -- how to name the visitor, defaults to "Visitor"
        //   parameters: [STRING], -- parameters to pass to visitor methods, defaults to ['state']
        //   useReturn: BOOL, -- use return values from visitor funcs
        //   pathAsParameter: BOOL -- when true then the path how the node was
        //                            accessed in its parent is passed into the visitors
        // }
        // EXAMPLE:
        // lively.ast.MozillaAST.createVisitorCode({openWindow: true, asLivelyClass: true, parameters: ['state'], useReturn: true});
        options = options || {};
        options.name = options.name || "Visitor";
        options.parameters = options.parameters || ['state'];
        var doc, interfaces, enums, nodeSpecs, enumSpecs, visitor, visitorCode;
        [options.loadFromMozillaPage ?
            function(next) {
                lively.ast.MozillaAST.SpiderMonkeyParserAPI.withDocument(function(err, _doc) {
                    if (err) { show(err); return; }
                    Global.doc = doc = _doc;
                    lively.ast.MozillaAST.Cache.interfaces = interfaces = lively.ast.MozillaAST.SpiderMonkeyParserAPI.filterParserAPIInterfaces(doc);
                    lively.ast.MozillaAST.Cache.enums = enums = lively.ast.MozillaAST.SpiderMonkeyParserAPI.filterParserAPIEnums(doc);
                    next();
                }); 
            } : function(next) {
                interfaces = lively.ast.MozillaAST.Cache.interfaces;
                enums = lively.ast.MozillaAST.Cache.enums;
                next();
            },
        function(next) {
            nodeSpecs = lively.ast.MozillaAST.SpiderMonkeyParserAPI.createNodeSpecs(interfaces);
            enumSpecs = lively.ast.MozillaAST.SpiderMonkeyParserAPI.createEnumSpecs(enums);
            next();
        },
        function(next) {
            visitorCode = lively.ast.MozillaAST.NodeSpecVisitorGenerator.printVisitorSpec(options, nodeSpecs, enumSpecs);
            next();
        },
        function(next) {
            options.openWindow && $world.addCodeEditor({
                title: 'Mozilla AST node visitor',
                content: visitorCode
            });
            next();
        }].doAndContinue(null, function() {
            thenDo && thenDo(null, visitorCode);
        });
    }
});

}) // end of module
