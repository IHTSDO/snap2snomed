/*
 * Copyright © 2022 SNOMED International
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.snomed.snap2snomed;

import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;
import java.util.Properties;
import org.springframework.stereotype.Component;

/**
 * Retrieves version information from the properties file created during the build, making it
 * available to other areas of the application.
 */
@Component
public class Snap2snomedVersion {

  private static final String GIT_PROPERTIES_FILE_NAME = "git.properties";
  private static final String GIT_COMMIT_SHORT = "git.commit.id.abbrev";

  private final Properties gitProperties = new Properties();

  public Snap2snomedVersion() {
    initialiseGitProperties();
  }

  private void initialiseGitProperties() {
    final InputStream gitPropertiesStream = getClass().getClassLoader()
        .getResourceAsStream(GIT_PROPERTIES_FILE_NAME);
    if (gitPropertiesStream != null) {
      try {
        gitProperties.load(gitPropertiesStream);
      } catch (final IOException e) {
        throw new RuntimeException("Unable to read property file: " + GIT_PROPERTIES_FILE_NAME);
      }
    } else {
      throw new RuntimeException(
          "Required property file not found in classpath: " + GIT_PROPERTIES_FILE_NAME);
    }
  }

  /**
   * @return a short Git commit SHA
   */
  public Optional<String> getShortGitCommit() {
    return Optional.ofNullable(gitProperties.getProperty(GIT_COMMIT_SHORT));
  }

}
