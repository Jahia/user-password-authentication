package org.jahia.modules.upa.mfa.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.upa.mfa.MfaError;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@GraphQLName("MfaError")
@GraphQLDescription("Error that may occur during an MFA operation")
public class Error {

    private final MfaError mfaError;

    public Error(MfaError mfaError) {
        this.mfaError = mfaError;
    }

    @GraphQLField
    @GraphQLDescription("Error code that can be used to load i18n error message")
    public String code() {
        return mfaError.getCode();
    }

    @GraphQLField
    @GraphQLDescription("Optional arguments of the error that can be used to generate the i18n error message")
    public List<GqlArgument> arguments() {
        return mfaError.getArguments().entrySet().stream()
                .map(GqlArgument::new)
                .collect(Collectors.toList());
    }

    @GraphQLName("MfaErrorArgument")
    @GraphQLDescription("Error argument that may occur during an MFA operation")
    public static class GqlArgument {
        private final Map.Entry<String, String> argumentEntry;

        public GqlArgument(Map.Entry<String, String> argumentEntry) {
            this.argumentEntry = argumentEntry;
        }

        @GraphQLField
        @GraphQLDescription("Name of the error argument")
        public String getName() {
            return argumentEntry.getKey();
        }

        @GraphQLField
        @GraphQLDescription("Value of the error argument")
        public String getValue() {
            return argumentEntry.getValue();
        }

    }
}
