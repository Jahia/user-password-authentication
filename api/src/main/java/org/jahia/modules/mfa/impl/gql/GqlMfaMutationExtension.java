package org.jahia.modules.mfa.impl.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;

@GraphQLTypeExtension(DXGraphQLProvider.Mutation.class)
public class GqlMfaMutationExtension {

    @GraphQLField
    @GraphQLName("mfa")
    @GraphQLDescription("Main access to MFA API")
    public static GqlMfaMutation mfa() {
        return new GqlMfaMutation();
    }
}
