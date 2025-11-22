package org.jahia.modules.mfa.emailcode.gql;

import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.mfa.gql.FactorsMutation;

@GraphQLTypeExtension(FactorsMutation.class)
public class EmailCodeFactorMutationExtension {

    @GraphQLField
    @GraphQLName("emailCode")
    @GraphQLDescription("Mutation entry point for the email code factor")
    public static EmailCodeFactorMutation emailCode() {
        return new EmailCodeFactorMutation();
    }
}
