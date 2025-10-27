package org.jahia.modules.mfa.impl.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;

@GraphQLTypeExtension(DXGraphQLProvider.Query.class)
public class GqlMfaQueryExtension {

    @GraphQLField
    @GraphQLName("mfa")
    @GraphQLDescription("Main access to MFA read-only API")
    public static GqlMfaQuery mfa() {
        return new GqlMfaQuery();
    }
}
