"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Abstract base Rewriter class
 * Extend this class and overwrite its methods to create a new rewriter
 */
var Rewriter = /** @class */ (function () {
    function Rewriter(_a) {
        var fieldName = _a.fieldName, rootTypes = _a.rootTypes, matchConditions = _a.matchConditions;
        this.rootTypes = ['query', 'mutation', 'fragment'];
        this.fieldName = fieldName;
        this.matchConditions = matchConditions;
        if (!this.fieldName && !this.matchConditions) {
            throw new Error('Neither a fieldName or matchConditions were provided. Please choose to pass either one in order to be able to detect which fields to rewrite.');
        }
        if (rootTypes)
            this.rootTypes = rootTypes;
    }
    Rewriter.prototype.matches = function (nodeAndVarDefs, parents) {
        var node = nodeAndVarDefs.node;
        // If no fieldName is provided, check for defined matchConditions.
        // This avoids having to define one rewriter for many fields individually.
        // Alternatively, regex matching for fieldName could be implemented.
        if (node.kind !== 'Field' ||
            (this.fieldName ? node.name.value !== this.fieldName : !this.matchConditions)) {
            return false;
        }
        var root = parents[0];
        if (root.kind === 'OperationDefinition' &&
            this.rootTypes.indexOf(root.operation) === -1) {
            return false;
        }
        if (root.kind === 'FragmentDefinition' && this.rootTypes.indexOf('fragment') === -1) {
            return false;
        }
        if (this.matchConditions &&
            !this.matchConditions.find(function (condition) { return condition(nodeAndVarDefs, parents); })) {
            return false;
        }
        return true;
    };
    Rewriter.prototype.rewriteQuery = function (nodeAndVarDefs, variables) {
        return nodeAndVarDefs;
    };
    Rewriter.prototype.rewriteVariables = function (nodeAndVarDefs, variables) {
        return variables;
    };
    /*
     * Receives the parent object of the matched field with the key of the matched field.
     * For arrays, the index of the element is also present.
     */
    Rewriter.prototype.rewriteResponse = function (response, key, index) {
        return response;
    };
    /*
     * Helper that extracts the element from the response if possible otherwise returns null.
     */
    Rewriter.prototype.extractReponseElement = function (response, key, index) {
        // Verify the response format
        var element = null;
        if (response === null || typeof response !== 'object')
            return element;
        // Extract the key
        element = response[key] || null;
        // Extract the position
        if (Array.isArray(element)) {
            element = element[index] || null;
        }
        return element;
    };
    /*
     * Helper that rewrite the element from the response if possible and returns the response.
     */
    Rewriter.prototype.rewriteResponseElement = function (response, newElement, key, index) {
        // Verify the response format
        if (response === null || typeof response !== 'object')
            return response;
        // Extract the key
        var element = response[key];
        // Extract the position
        // NOTE: We might eventually want to create an array if one is not present at the key
        // and we receive an index in input
        if (Array.isArray(element)) {
            element[index] = newElement;
        }
        else {
            response[key] = newElement;
        }
        return response;
    };
    return Rewriter;
}());
exports.default = Rewriter;
//# sourceMappingURL=Rewriter.js.map