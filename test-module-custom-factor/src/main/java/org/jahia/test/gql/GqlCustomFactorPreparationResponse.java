package org.jahia.test.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaException;
import org.jahia.modules.mfa.MfaSession;
import org.jahia.modules.mfa.gql.GqlMfaGenericResponse;

@GraphQLName("MfaCustomFactorPreparationResponse")
@GraphQLDescription("Custom factor preparation result")
public class GqlCustomFactorPreparationResponse extends GqlMfaGenericResponse {

    @GraphQLField
    private final String otherInfo;

    public GqlCustomFactorPreparationResponse(MfaSession session, String otherInfo) {
        super(session);
        this.otherInfo = otherInfo;
    }

    public GqlCustomFactorPreparationResponse(MfaException mfaException) {
        super(mfaException);
        this.otherInfo = null;
    }

    public GqlCustomFactorPreparationResponse(Exception mfaException) {
        super(mfaException);
        this.otherInfo = null;
    }

    public String getOtherInfo() {
        return otherInfo;
    }
}
