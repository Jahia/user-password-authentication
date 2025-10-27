package org.jahia.modules.mfa.emailcode.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaException;
import org.jahia.modules.mfa.MfaSession;
import org.jahia.modules.mfa.gql.GqlMfaGenericResponse;

@GraphQLName("MfaEmailCodeFactorPreparationResponse")
@GraphQLDescription("Email code factor preparation result")
public class GqlMfaEmailCodeFactorPreparationResponse extends GqlMfaGenericResponse {

    @GraphQLField
    @GraphQLDescription("masked email the verification code has been sent to")
    private final String maskedEmail;

    public GqlMfaEmailCodeFactorPreparationResponse(MfaSession session, String maskedEmail) {
        super(session);
        this.maskedEmail = maskedEmail;
    }

    public GqlMfaEmailCodeFactorPreparationResponse(Exception mfaException) {
        super(mfaException);
        this.maskedEmail = null;
    }

    public GqlMfaEmailCodeFactorPreparationResponse(MfaException mfaException) {
        super(mfaException);
        this.maskedEmail = null;
    }
}
