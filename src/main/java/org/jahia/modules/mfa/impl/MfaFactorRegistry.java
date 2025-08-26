package org.jahia.modules.mfa.impl;

import org.jahia.modules.mfa.MfaFactorProvider;
import org.osgi.service.component.annotations.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Internal registry service that manages all available MFA factor providers.
 * Uses OSGI dynamic services to automatically discover and register factor providers.
 * This is an implementation detail - MfaService provides the public API.
 */
@Component(service = MfaFactorRegistry.class, immediate = true)
public class MfaFactorRegistry {
    private static final Logger logger = LoggerFactory.getLogger(MfaFactorRegistry.class);

    private final Map<String, MfaFactorProvider> providers = new ConcurrentHashMap<>();

    @Reference(
        cardinality = ReferenceCardinality.MULTIPLE,
        policy = ReferencePolicy.DYNAMIC,
        policyOption = ReferencePolicyOption.GREEDY
    )
    public void addFactorProvider(MfaFactorProvider provider) {
        String factorType = provider.getFactorType();
        providers.put(factorType, provider);
        logger.info("Registered MFA factor provider: {} for type: {}",
                   provider.getClass().getSimpleName(), factorType);
    }

    public void removeFactorProvider(MfaFactorProvider provider) {
        String factorType = provider.getFactorType();
        providers.remove(factorType, provider);
        logger.info("Unregistered MFA factor provider: {} for type: {}",
                   provider.getClass().getSimpleName(), factorType);
    }

    /**
     * Gets the provider for a specific factor type.
     */
    public Optional<MfaFactorProvider> getProvider(String factorType) {
        return Optional.ofNullable(providers.get(factorType));
    }

    /**
     * Gets all registered providers (for internal use by MfaService).
     */
    public Collection<MfaFactorProvider> getAllProviders() {
        return providers.values();
    }
}
