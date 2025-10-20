package org.jahia.modules.mfa.impl.gql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;

import java.util.List;

@GraphQLName("MfaError")
@GraphQLDescription("Error that may occur during an MFA operation")
public class GqlMfaError {
    @GraphQLField
    @GraphQLDescription("Error code that can be used to load i18n error message")
    private String code;

    @GraphQLField
    @GraphQLDescription("Optional arguments of the error that can be used to generate the i18n error message")
    private List<Argument> arguments;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public List<Argument> getArguments() {
        return arguments;
    }

    public void setArguments(List<Argument> arguments) {
        this.arguments = arguments;
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
