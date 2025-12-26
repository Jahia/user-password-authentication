package org.jahia.modules.upa.mfa.impl.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;

@GraphQLTypeExtension(DXGraphQLProvider.Mutation.class)
public class MutationExtension {

    private MutationExtension() {
        // no need to be instantiated
    }

    @GraphQLField
    @GraphQLName("upa")
    @GraphQLDescription("Main access to User Password Authentication (UPA) API")
    public static Mutation upa() {
        return new Mutation();
    }
}
