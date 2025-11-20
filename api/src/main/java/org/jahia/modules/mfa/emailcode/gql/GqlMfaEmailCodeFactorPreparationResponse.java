package org.jahia.modules.mfa.emailcode.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaSession;
import org.jahia.modules.mfa.emailcode.EmailCodeFactorProvider;
import org.jahia.modules.mfa.gql.GqlMfaGenericResponse;

@GraphQLName("MfaEmailCodeFactorPreparationResponse")
@GraphQLDescription("Email code factor preparation result")
public class GqlMfaEmailCodeFactorPreparationResponse extends GqlMfaGenericResponse {

    private final String maskedEmail;

    public GqlMfaEmailCodeFactorPreparationResponse(MfaSession session, EmailCodeFactorProvider.PreparationResult preparationResult) {
        super(session);
        this.maskedEmail = preparationResult != null ? preparationResult.getMaskedEmail() : null;
    }

    @GraphQLField
    @GraphQLDescription("masked email the verification code has been sent to")
    public String getMaskedEmail() {
        return maskedEmail;
    }
}
