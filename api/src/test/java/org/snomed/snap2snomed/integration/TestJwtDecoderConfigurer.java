package org.snomed.snap2snomed.integration;

import org.snomed.snap2snomed.security.JwtDecoderConfigurer;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Import;

@Configuration
@DependsOn("mockAuthServer")
@Import(JwtDecoderConfigurer.class)
public class TestJwtDecoderConfigurer {
}