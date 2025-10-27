package org.jahia.modules.mfa.emailcode.gql;

import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.mfa.gql.GqlFactorsMutation;

@GraphQLTypeExtension(GqlFactorsMutation.class)
public class GqlEmailCodeFactorMutationExtension {

    @GraphQLField
    @GraphQLName("emailCode")
    public static GqlEmailCodeFactorMutation emailCode() {
        return new GqlEmailCodeFactorMutation();
    }

}
