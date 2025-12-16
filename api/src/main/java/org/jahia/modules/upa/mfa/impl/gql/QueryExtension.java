package org.jahia.modules.upa.mfa.impl.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;

@GraphQLTypeExtension(DXGraphQLProvider.Query.class)
public class QueryExtension {

    private QueryExtension() {
        // no need to be instantiated
    }

    @GraphQLField
    @GraphQLName("mfa")
    @GraphQLDescription("Main access to MFA read-only API")
    public static Query mfa() {
        return new Query();
    }
}
