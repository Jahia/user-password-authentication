package org.jahia.modules.mfa.impl.gql.extensions;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;
import org.jahia.modules.mfa.impl.gql.GqlMfaMutation;

@GraphQLTypeExtension(DXGraphQLProvider.Mutation.class)
public class GqlMfaMutationExtension {

    @GraphQLField
    @GraphQLName("mfa")
    @GraphQLDescription("Main access to MFA API")
    public static GqlMfaMutation mfa() {
        return new GqlMfaMutation();
    }
}