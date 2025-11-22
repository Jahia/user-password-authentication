package org.jahia.test.gql;

import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.mfa.gql.FactorsMutation;

@GraphQLTypeExtension(FactorsMutation.class)
public class CustomFactorMutationExtension {

    @GraphQLField
    @GraphQLName("custom")
    public static CustomFactorMutation emailCode() {
        return new CustomFactorMutation();
    }

}
