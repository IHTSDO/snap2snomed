package org.snomed.snap2snomed.controller.dto;

import lombok.Data;

import java.util.Set;

@Data
public class ValidationResult {

    Integer activeCount;
    Set<String> inactive;
    Set<String> absent;
    Set<String> invalid;

    public ValidationResult(Integer activeCount, Set<String> inactive, Set<String> absent, Set<String> invalid) {
        this.activeCount = activeCount;
        this.inactive = inactive;
        this.absent = absent;
        this.invalid = invalid;
    }

    @Override
    public String toString() {
        return "ValidationResult{" +
                "activeCount=" + activeCount +
                ", inactive=[" + inactive.size() + "]" +
                ", absent=[" + absent.size() + "]" +
                ", invalid=[" + invalid.size() + "]" +
                '}';
    }
}
