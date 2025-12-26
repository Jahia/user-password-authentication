/*
 * ==========================================================================================
 * =                            JAHIA'S ENTERPRISE DISTRIBUTION                             =
 * ==========================================================================================
 *
 *                                  http://www.jahia.com
 *
 * JAHIA'S ENTERPRISE DISTRIBUTIONS LICENSING - IMPORTANT INFORMATION
 * ==========================================================================================
 *
 *     Copyright (C) 2002-2025 Jahia Solutions Group. All rights reserved.
 *
 *     This file is part of a Jahia's Enterprise Distribution.
 *
 *     Jahia's Enterprise Distributions must be used in accordance with the terms
 *     contained in the Jahia Solutions Group Terms &amp; Conditions as well as
 *     the Jahia Sustainable Enterprise License (JSEL).
 *
 *     For questions regarding licensing, support, production usage...
 *     please contact our team at sales@jahia.com or go to http://www.jahia.com/license.
 *
 * ==========================================================================================
 */
package org.jahia.modules.upa.mfa.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.upa.mfa.MfaFactorState;

@GraphQLName("MfaFactorState")
@GraphQLDescription("State of a single MFA factor: preparation, verification and recoverable factor-level error")
public class FactorState {
    private final MfaFactorState state;

    public FactorState(MfaFactorState state) {
        this.state = state;
    }

    @GraphQLField
    @GraphQLName("prepared")
    @GraphQLDescription("True after the factor has been successfully prepared")
    public boolean isPrepared() {
        return state.isPrepared();
    }

    @GraphQLField
    @GraphQLName("verified")
    @GraphQLDescription("True after the factor has been successfully verified")
    public boolean isVerified() {
        return state.isVerified();
    }

    @GraphQLField
    @GraphQLName("error")
    @GraphQLDescription("Recoverable factor-level error (e.g. invalid code, rate limit). Session-level errors take precedence.")
    public Error getError() {
        return state.hasError() ? new Error(state.getError()) : null;
    }
}
