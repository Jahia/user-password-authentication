package org.jahia.modules.mfa.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLName;

/**
 * GraphQL extension point for MFA factor-specific mutations.
 * <p>
 * This class serves as a base type that can be extended by custom MFA factor implementations
 * to add their own GraphQL mutation endpoints.
 *
 * @see org.jahia.modules.mfa.emailcode.gql.GqlEmailCodeFactorMutationExtension for an example
 */
@GraphQLName("MfaFactorsMutation")
@GraphQLDescription("Access MFA factors specific mutations")
public class GqlFactorsMutation {

}
