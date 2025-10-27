package org.jahia.test.gql;

import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.mfa.gql.GqlFactorsMutation;

@GraphQLTypeExtension(GqlFactorsMutation.class)
public class GqlCustomFactorMutationExtension {

    @GraphQLField
    @GraphQLName("custom")
    public static GqlCustomFactorMutation emailCode() {
        return new GqlCustomFactorMutation();
    }

}
