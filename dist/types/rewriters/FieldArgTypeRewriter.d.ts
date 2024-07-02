import { ArgumentNode, ASTNode, FieldNode, TypeNode, ValueNode } from 'graphql';
import Maybe from 'graphql/tsutils/Maybe';
import { NodeAndVarDefs } from '../ast';
import Rewriter, { RewriterOpts, Variables } from './Rewriter';
interface FieldArgTypeRewriterOpts extends RewriterOpts {
    root?: string;
    argName: string;
    oldType: string;
    newType: string;
    coerceVariable?: (variable: any, context: {
        variables: Variables;
        args: ArgumentNode[];
    }) => any;
    /**
     * EXPERIMENTAL:
     *  This allows to coerce value of argument when their value is not stored in a variable
     *  but comes in the query node itself.
     *  NOTE: At the moment, the user has to return the ast value node herself.
     */
    coerceArgumentValue?: (variable: any, context: {
        variables: Variables;
        args: ArgumentNode[];
    }) => Maybe<ValueNode>;
}
/**
 * Rewriter which replaces the type of a single argument of a field
 * ex: change from id: String! to id: ID!
 */
declare class FieldArgTypeRewriter extends Rewriter {
    protected argName: string;
    protected root?: string;
    protected oldTypeNode: TypeNode;
    protected newTypeNode: TypeNode;
    protected coerceVariable: (variable: any, context: {
        variables: Variables;
        args: ArgumentNode[];
    }) => any;
    protected coerceArgumentValue: (variable: any, context: {
        variables: Variables;
        args: ArgumentNode[];
    }) => Maybe<ValueNode>;
    constructor(options: FieldArgTypeRewriterOpts);
    private getMatchingArgument;
    matches(nodeAndVars: NodeAndVarDefs, parents: ASTNode[]): boolean;
    rewriteQuery({ node: astNode, variableDefinitions }: NodeAndVarDefs, variables: Variables): {
        node: FieldNode;
        variableDefinitions: ReadonlyArray<import("graphql").VariableDefinitionNode>;
    };
    rewriteVariables({ node: astNode }: NodeAndVarDefs, variables: Variables): {
        [x: string]: any;
    } | undefined;
    private extractMatchingVarRefName;
}
export default FieldArgTypeRewriter;
