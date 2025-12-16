package org.jahia.test;

import java.io.Serializable;

public class VerificationData implements Serializable {
    private final int number;

    public VerificationData(int number) {
        this.number = number;
    }

    public int getNumber() {
        return number;
    }
}
