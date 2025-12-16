package org.jahia.test.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.upa.mfa.MfaSession;
import org.jahia.modules.upa.mfa.gql.Result;
import org.jahia.test.CustomFactorProvider;

@GraphQLName("MfaCustomFactorPreparation")
@GraphQLDescription("Custom factor preparation result")
public class CustomFactorPreparation extends Result {

    @GraphQLField
    private final String otherInfo;

    public CustomFactorPreparation(MfaSession session, CustomFactorProvider.PreparationResult preparationResult) {
        super(session);
        this.otherInfo = preparationResult != null ? preparationResult.getOtherInfo() : null;
    }

    public String getOtherInfo() {
        return otherInfo;
    }
}
