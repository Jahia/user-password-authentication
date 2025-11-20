package org.jahia.test.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaSession;
import org.jahia.modules.mfa.gql.GqlMfaGenericResponse;
import org.jahia.test.CustomFactorProvider;

@GraphQLName("MfaCustomFactorPreparationResponse")
@GraphQLDescription("Custom factor preparation result")
public class GqlCustomFactorPreparationResponse extends GqlMfaGenericResponse {

    @GraphQLField
    private final String otherInfo;

    public GqlCustomFactorPreparationResponse(MfaSession session, CustomFactorProvider.PreparationResult preparationResult) {
        super(session);
        this.otherInfo = preparationResult != null ? preparationResult.getOtherInfo() : null;
    }

    public String getOtherInfo() {
        return otherInfo;
    }
}
