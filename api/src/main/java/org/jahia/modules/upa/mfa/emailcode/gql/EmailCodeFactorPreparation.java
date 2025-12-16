package org.jahia.modules.upa.mfa.emailcode.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.upa.mfa.MfaSession;
import org.jahia.modules.upa.mfa.emailcode.EmailCodeFactorProvider;
import org.jahia.modules.upa.mfa.gql.Result;

@GraphQLName("MfaEmailCodeFactorPreparation")
@GraphQLDescription("Email code factor preparation result including masked destination address")
public class EmailCodeFactorPreparation extends Result {

    private final String maskedEmail;

    public EmailCodeFactorPreparation(MfaSession session, EmailCodeFactorProvider.PreparationResult preparationResult) {
        super(session);
        this.maskedEmail = preparationResult != null ? preparationResult.getMaskedEmail() : null;
    }

    @GraphQLField
    @GraphQLName("maskedEmail")
    @GraphQLDescription("Masked email address where the verification code was sent (redacted for privacy)")
    public String getMaskedEmail() {
        return maskedEmail;
    }
}
