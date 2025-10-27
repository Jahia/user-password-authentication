package org.jahia.modules.mfa.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.mfa.MfaException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@GraphQLName("MfaError")
@GraphQLDescription("Error that may occur during an MFA operation")
public class GqlError {
    private static final Logger logger = LoggerFactory.getLogger(GqlError.class);
    @GraphQLField
    @GraphQLDescription("Error code that can be used to load i18n error message")
    private final String code;

    @GraphQLField
    @GraphQLDescription("Optional arguments of the error that can be used to generate the i18n error message")
    private final List<Argument> arguments;

    public GqlError(MfaException mfaException) {
        this.code = mfaException.getCode();
        // Convert Map<String, String> to List<GqlMfaError.Argument>
        Map<String, String> argumentsMap = mfaException.getArguments();
        this.arguments = argumentsMap != null
                ? argumentsMap.entrySet().stream()
                .map(entry -> createArgument(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList())
                : Collections.emptyList();
    }

    public GqlError(Exception unexpectedException) {
        this(new MfaException("unexpected_error"));
        logger.warn("An unexpected exception occurred: {}", unexpectedException.getMessage());
        logger.debug("Details:", unexpectedException);
    }

    private static GqlError.Argument createArgument(String name, String value) {
        GqlError.Argument arg = new GqlError.Argument();
        arg.setName(name);
        arg.setValue(value);
        return arg;
    }

    public String getCode() {
        return code;
    }


    public List<Argument> getArguments() {
        return arguments;
    }

    @GraphQLName("MfaErrorArgument")
    @GraphQLDescription("Error argument that may occur during an MFA operation")
    public static class Argument {
        @GraphQLField
        @GraphQLDescription("Name of the error argument")
        private String name;
        @GraphQLField
        @GraphQLDescription("Value of the error argument")
        private String value;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }
    }
}
