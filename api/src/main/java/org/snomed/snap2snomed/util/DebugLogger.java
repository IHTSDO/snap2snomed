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

package org.snomed.snap2snomed.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.event.Level;


import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public interface DebugLogger {

    Level[] _level = new Level[] { Level.DEBUG };

    static void setLevel(Level level) {
        DebugLogger._level[0] = level;
    }

    default void entering() {
        doLog("ENTER          - " + getStackRef().replaceAll("^[^#]+#", ""));
    }

    default void exiting() {
        doLog("RETURN         - " + getStackRef().replaceAll("^[^#]+#", ""));
    }

    default void exiting(boolean result) {
        doLog("RETURN [" + result + "]" + (result ? " " : "") + " - " + getStackRef().replaceAll("^[^#]+#", ""));
    }

    private void doLog(String message) {
        Logger _log = LoggerFactory.getLogger(this.getClass());
        switch (_level[0]) {
            case TRACE:
                _log.trace(message);
                break;
            case DEBUG:
                _log.debug(message);
                break;
            case INFO:
                _log.info(message);
                break;
            case WARN:
                _log.warn(message);
                break;
            case ERROR:
                _log.error(message);
                break;
        }
    }

    private String getStackRef() {
        StackTraceElement[] stackTraceElements = Thread.currentThread().getStackTrace();
        List<StackTraceElement> stax = new ArrayList<>();
        for (StackTraceElement element : stackTraceElements) {
            if (element.getClassName().startsWith("org.snomed.snap2snomed") &&
                    !element.getClassName().equals(DebugLogger.class.getCanonicalName()) &&
                    (!element.getClassName().equals(this.getClass().getCanonicalName()) ||
                            !element.getMethodName().matches("^(entering|exiting|getStackRef)$"))) {
                stax.add(element);
            }
        }
        return String.join(" <-- ", stax.stream()
                .map(el -> el.getClassName().replaceAll("^.*\\.([^.]+)$", "$1") +
                        "#" + el.getMethodName() + ":" + el.getLineNumber()).collect(Collectors.toList()));
    }
}
