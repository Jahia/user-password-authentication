package org.jahia.modules.mfa.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.emailcode.gql.EmailCodeFactorMutationExtension;

/**
 * GraphQL extension point for MFA factor-specific mutations.
 * <p>
 * This class serves as a base type that can be extended by custom MFA factor implementations
 * to add their own GraphQL mutation endpoints.
 *
 * @see EmailCodeFactorMutationExtension for an example
 */
@GraphQLName("MfaFactorsMutation")
@GraphQLDescription("Container for factor-specific mutation entry points (extended by individual factor extensions)")
public class FactorsMutation {
    // Acts as an extension aggregation root; intentionally empty.
}
