package org.jahia.modules.mfa.impl.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaException;
import org.jahia.modules.mfa.MfaSession;
import org.jahia.modules.mfa.impl.factors.EmailCodeFactorProvider;

@GraphQLName("MfaEmailCodeFactorPreparationResponse")
@GraphQLDescription("Email code factor preparation result")
public class GqlMfaEmailCodeFactorPreparationResponse extends GqlMfaBaseResponse {

    @GraphQLField
    @GraphQLDescription("masked email the verification code has been sent to")
    String maskedEmail;

    private GqlMfaEmailCodeFactorPreparationResponse() {
    }

    private GqlMfaEmailCodeFactorPreparationResponse(MfaSession session) {
        super(session);
    }

    public String getMaskedEmail() {
        return maskedEmail;
    }

    public void setMaskedEmail(String maskedEmail) {
        this.maskedEmail = maskedEmail;
    }

    static GqlMfaEmailCodeFactorPreparationResponse buildSuccessResponse(MfaSession session) {
        GqlMfaEmailCodeFactorPreparationResponse response = new GqlMfaEmailCodeFactorPreparationResponse(session);
        response.setSuccess(true);
        EmailCodeFactorProvider.PreparationResult emailCodeFactorPreparationResult = (EmailCodeFactorProvider.PreparationResult) session.getPreparationResult();
        response.setMaskedEmail(emailCodeFactorPreparationResult.getMaskedEmail());
        return response;
    }

    static GqlMfaEmailCodeFactorPreparationResponse buildErrorResponse(MfaException mfaException) {
        return GqlMfaUtils.buildErrorResponse(mfaException, GqlMfaEmailCodeFactorPreparationResponse::new);
    }

    static GqlMfaEmailCodeFactorPreparationResponse buildErrorResponse(Exception unexpectedException) {
        return GqlMfaUtils.buildErrorResponse(unexpectedException, GqlMfaEmailCodeFactorPreparationResponse::new);
    }
}