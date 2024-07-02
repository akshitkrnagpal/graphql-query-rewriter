"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var ast_1 = require("../ast");
var utils_1 = require("../utils");
var Rewriter_1 = require("./Rewriter");
/**
 * Rewriter which replaces the type of a single argument of a field
 * ex: change from id: String! to id: ID!
 */
var FieldArgTypeRewriter = /** @class */ (function (_super) {
    __extends(FieldArgTypeRewriter, _super);
    function FieldArgTypeRewriter(options) {
        var _this = _super.call(this, options) || this;
        _this.root = options.root;
        _this.argName = options.argName;
        _this.oldTypeNode = graphql_1.parseType(options.oldType);
        _this.newTypeNode = graphql_1.parseType(options.newType);
        _this.coerceVariable = options.coerceVariable || utils_1.identifyFunc;
        _this.coerceArgumentValue = options.coerceArgumentValue || utils_1.identifyFunc;
        return _this;
    }
    FieldArgTypeRewriter.prototype.getMatchingArgument = function (node) {
        var _this = this;
        if (this.root) {
            var rootNode = (node.arguments || []).find(function (arg) { return arg.name.value === _this.root; });
            if (!rootNode)
                return undefined;
            if (rootNode.value.kind === 'ObjectValue') {
                return rootNode.value.fields.find(function (field) { return field.name.value === _this.argName; });
            }
        }
        else {
            return (node.arguments || []).find(function (arg) { return arg.name.value === _this.argName; });
        }
    };
    FieldArgTypeRewriter.prototype.matches = function (nodeAndVars, parents) {
        if (!_super.prototype.matches.call(this, nodeAndVars, parents))
            return false;
        var node = nodeAndVars.node;
        var variableDefinitions = nodeAndVars.variableDefinitions;
        // is this a field with the correct fieldName and arguments?
        if (node.kind !== 'Field')
            return false;
        // does this field contain arguments?
        if (!node.arguments)
            return false;
        var matchingArgument = this.getMatchingArgument(node);
        if (!matchingArgument)
            return false;
        // argument value is stored in a variable
        if (matchingArgument.value.kind === 'Variable') {
            var varRef = matchingArgument.value.name.value;
            // does the referenced variable have the correct type?
            for (var _i = 0, variableDefinitions_1 = variableDefinitions; _i < variableDefinitions_1.length; _i++) {
                var varDefinition = variableDefinitions_1[_i];
                if (varDefinition.variable.name.value === varRef) {
                    return ast_1.nodesMatch(this.oldTypeNode, varDefinition.type);
                }
            }
        }
        // argument value comes in query doc.
        else {
            var argValueNode = matchingArgument.value;
            return graphql_1.isValueNode(argValueNode);
            // Would be ideal to do a nodesMatch in here, however argument value nodes
            // have different format for their values than when passed as variables.
            // For instance, are parsed with Kinds as "graphql.Kind" (e.g., INT="IntValue") and not "graphql.TokenKinds" (e.g., INT="Int")
            // So they might not match correctly. Also they dont contain additional parsed syntax
            // as the non-optional symbol "!". So just return true if the argument.value is a ValueNode.
            //
            // return nodesMatch(this.oldTypeNode, parseType(argRef.kind));
        }
        return false;
    };
    FieldArgTypeRewriter.prototype.rewriteQuery = function (_a, variables) {
        var _this = this;
        var astNode = _a.node, variableDefinitions = _a.variableDefinitions;
        var node = astNode;
        var varRefName = this.extractMatchingVarRefName(node);
        // If argument value is stored in a variable
        if (varRefName) {
            var newVarDefs = variableDefinitions.map(function (varDef) {
                if (varDef.variable.name.value !== varRefName)
                    return varDef;
                return __assign({}, varDef, { type: _this.newTypeNode });
            });
            return { node: node, variableDefinitions: newVarDefs };
        }
        // If argument value is not stored in a variable but in the query node.
        var matchingArgument = this.getMatchingArgument(node);
        if (node.arguments && matchingArgument) {
            var args = node.arguments.slice();
            var newValue = this.coerceArgumentValue(matchingArgument.value, { variables: variables, args: args });
            /**
             * TODO: If somewhow we can get the schema here, we could make the coerceArgumentValue
             * even easier, as we would be able to construct the ast node for the argument value.
             * as of now, the user has to take care of correctly constructing the argument value ast node herself.
             *
             * const schema = makeExecutableSchema({typeDefs})
             * const myCustomType = schema.getType("MY_CUSTOM_TYPE_NAME")
             * const newArgValue = astFromValue(newValue, myCustomType)
             * Object.assign(matchingArgument, { value: newArgValue })
             */
            if (newValue)
                Object.assign(matchingArgument, { value: newValue });
        }
        return { node: node, variableDefinitions: variableDefinitions };
    };
    FieldArgTypeRewriter.prototype.rewriteVariables = function (_a, variables) {
        var astNode = _a.node;
        var _b;
        var node = astNode;
        if (!variables)
            return variables;
        var varRefName = this.extractMatchingVarRefName(node);
        var args = (node.arguments ? node.arguments : []).slice();
        return __assign({}, variables, (varRefName
            ? (_b = {}, _b[varRefName] = this.coerceVariable(variables[varRefName], { variables: variables, args: args }), _b) : {}));
    };
    FieldArgTypeRewriter.prototype.extractMatchingVarRefName = function (node) {
        var matchingArgument = this.getMatchingArgument(node);
        var variableNode = matchingArgument.value;
        return variableNode.kind === graphql_1.Kind.VARIABLE && variableNode.name.value;
    };
    return FieldArgTypeRewriter;
}(Rewriter_1.default));
exports.default = FieldArgTypeRewriter;
//# sourceMappingURL=FieldArgTypeRewriter.js.map