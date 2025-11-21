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
package org.jahia.modules.mfa.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaFactorState;

@GraphQLName("MfaFactorState")
@GraphQLDescription("Details about an MFA factor")
public class GqlFactorState {
    private final MfaFactorState state;

    public GqlFactorState(MfaFactorState state) {
        this.state = state;
    }

    @GraphQLField
    @GraphQLDescription("Whether the factor has been prepared or not")
    public boolean isPrepared() {
        return state.isPrepared();
    }

    @GraphQLField
    @GraphQLDescription("Whether the factor has been verified or not")
    public boolean isVerified() {
        return state.isVerified();
    }

    @GraphQLField
    @GraphQLDescription("Factor-level error that is non-fatal and specific to this factor. If not null, this factor encountered a recoverable error (e.g., invalid code, rate limit), but other factors may still be attempted or this factor can be retried. Check session-level error first for irrecoverable failures.")
    public GqlError getError() {
        return state.hasError() ? new GqlError(state.getError()) : null;
    }

}
