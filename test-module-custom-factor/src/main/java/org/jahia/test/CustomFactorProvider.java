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
package org.jahia.test;

import org.jahia.modules.mfa.MfaFactorProvider;
import org.jahia.modules.mfa.PreparationContext;
import org.jahia.modules.mfa.VerificationContext;
import org.osgi.service.component.annotations.Component;

import java.io.Serializable;

@Component(service = MfaFactorProvider.class, immediate = true)
public class CustomFactorProvider implements MfaFactorProvider {
    public static final String FACTOR_TYPE = "custom";

    @Override
    public String getFactorType() {
        return FACTOR_TYPE;
    }

    @Override
    public Serializable prepare(PreparationContext preparationContext) {
        int offset = Integer.parseInt(preparationContext.getHttpServletRequest().getHeader("X-offset"));
        int number = 123456;
        int result = number + offset;
        String otherInfo = "otherInfo"; // demonstrate additional info can be returned
        return new PreparationResult(result, otherInfo);
    }

    @Override
    public boolean verify(VerificationContext verificationContext) {
        PreparationResult preparationResult = (PreparationResult) verificationContext.getPreparationResult();
        int preparedCode = preparationResult.getResult();

        VerificationData verificationData = (VerificationData) verificationContext.getVerificationData();
        int number = verificationData.getNumber();
        return preparedCode == number;
    }

    public static class PreparationResult implements Serializable {
        private final int result;
        private final String otherInfo;


        private PreparationResult(int result, String otherInfo) {
            this.result = result;
            this.otherInfo = otherInfo;
        }

        public int getResult() {
            return result;
        }

        public String getOtherInfo() {
            return otherInfo;
        }
    }
}
