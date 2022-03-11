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

package org.snomed.snap2snomed.security;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.Predicate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.snomed.snap2snomed.problem.BadRequestDataProblem;
import org.snomed.snap2snomed.problem.Snap2SnomedProblem;
import org.snomed.snap2snomed.problem.auth.NotAuthorisedProblem;
import org.springframework.http.HttpMethod;
import org.springframework.web.filter.GenericFilterBean;


@Slf4j
public class PreAuthFilter extends GenericFilterBean {

    WebSecurity webSecurity;
    List<FilterRule> rules;

    public PreAuthFilter() {
        rules = Arrays.asList(

            // REST repository GET operations
            new FilterRule(HttpMethod.GET, "/projects/([^\\/]+).*", groupValues -> webSecurity.hasAnyProjectRole(asLong(groupValues[0])) || webSecurity.isAdminUser()),
            new FilterRule(HttpMethod.GET, "/projects", groupValues -> webSecurity.isValidUser()), // result filtered by query

            new FilterRule(HttpMethod.GET, "/importedCodeSets", groupValues -> webSecurity.isValidUser()), // result filtered by query
            new FilterRule(HttpMethod.GET, "/importedCodeSets/search/byIdForOwner", groupValues -> webSecurity.isValidUser()), // result filtered by query
            new FilterRule(HttpMethod.GET, "/importedCodeSets/([^\\/]+).*", groupValues -> webSecurity.isAdminUser() || webSecurity.isAuthorisedForImportedCodeSet(asLong(groupValues[0]))),

            new FilterRule(HttpMethod.GET, "/maps", groupValues -> webSecurity.isValidUser()), // result filtered by query
            new FilterRule(HttpMethod.GET, "/maps/([^\\/]+).*", groupValues -> webSecurity.isAdminUser() || webSecurity.hasAnyProjectRoleForMapId(asLong(groupValues[0])) ),

            new FilterRule(HttpMethod.GET, "/importedCodes/([^\\/]+)", groupValues -> webSecurity.isAdminUser() || webSecurity.isAuthorisedForImportedCode(asLong(groupValues[0]))),
            new FilterRule(HttpMethod.GET, "/importedCodes/search/findByImportedCodeSet", groupValues -> webSecurity.isValidUser()), // result filtered by query

            new FilterRule(HttpMethod.GET, "/mapRows", groupValues -> webSecurity.isValidUser()), // result filtered by query
            new FilterRule(HttpMethod.GET, "/mapRows/search/findMapRowsByMapId", groupValues -> webSecurity.isValidUser()), // result filtered by query
            new FilterRule(HttpMethod.GET, "/mapRows/([^\\/]+).*", groupValues -> webSecurity.isAdminUser() || webSecurity.hasAnyProjectRoleForMapRowId(asLong(groupValues[0]))),

            new FilterRule(HttpMethod.GET, "/mapRowTargets/search/findByMapId", groupValues -> webSecurity.isValidUser()), // result filtered by query
            new FilterRule(HttpMethod.GET, "/mapRowTargets", groupValues -> webSecurity.isValidUser()), //TODO filter

            new FilterRule(HttpMethod.GET, "/tasks/search/findByMapId", groupValues -> webSecurity.isValidUser()),
            new FilterRule(HttpMethod.GET, "/tasks/[^\\/]+/revisions", groupValues -> webSecurity.isValidUser()), // this is relaxed because the task may be deleted and therefore can't be used to determine project membership!
            new FilterRule(HttpMethod.GET, "/tasks/([^\\/]+).*", groupValues -> webSecurity.isAdminUser() || webSecurity.hasAnyProjectRoleForTaskId(asLong(groupValues[0]))),
            new FilterRule(HttpMethod.GET, "/tasks", groupValues -> webSecurity.isValidUser()),

            new FilterRule(HttpMethod.GET, "/users", groupValues -> webSecurity.isValidUser()),
            new FilterRule(HttpMethod.GET, "/users/.*", groupValues -> webSecurity.isValidUser()),

            new FilterRule(HttpMethod.GET, "/notes/search/findByMapRowId", groupValues -> webSecurity.isValidUser()),
            new FilterRule(HttpMethod.GET, "/notes/.*", groupValues -> webSecurity.isValidUser()),
            new FilterRule(HttpMethod.GET, "/notes", groupValues -> webSecurity.isValidUser()),

            // REST controller GET operations need to be passed through
            // TODO these already do this validation, do we need to do it here too or just pass it on?
            new FilterRule(HttpMethod.GET, "/map/([^\\/]+)/validateTargetCodes", groupValues -> webSecurity.isProjectOwnerForMapId(asLong(groupValues[0])) || webSecurity.isAdminUser()),
            new FilterRule(HttpMethod.GET, "/mapView", groupValues -> webSecurity.isValidUser()),
            new FilterRule(HttpMethod.GET, "/mapView/([^\\/]+)", groupValues -> webSecurity.hasAnyProjectRoleForMapId(asLong(groupValues[0])) || webSecurity.isAdminUser()),
            new FilterRule(HttpMethod.GET, "/mapView/task/([^\\/]+)", groupValues -> webSecurity.isTaskAssignee(asLong(groupValues[0])) || webSecurity.isAdminUser()),
            new FilterRule(HttpMethod.GET, "/task/([^\\/]+)/\\$countIncompleteRows", groupValues -> webSecurity.isValidUser()),
            new FilterRule(HttpMethod.GET, "/task/([^\\/]+)/.*", groupValues -> webSecurity.isTaskAssignee(asLong(groupValues[0])) || webSecurity.isAdminUser()),

            new FilterRule(HttpMethod.GET, "/v3/api-docs/.*", groupValues -> webSecurity.isValidUser()),
            new FilterRule(HttpMethod.GET, "/swagger-ui.*", groupValues -> webSecurity.isValidUser()),

            new FilterRule(HttpMethod.GET, "/actuator/info", groupValues -> true),
            new FilterRule(HttpMethod.GET, "/actuator/health", groupValues -> true),
            new FilterRule(HttpMethod.GET, "/config", groupValues -> true),

            new FilterRule(HttpMethod.PUT, "/(.*)", groupValues -> true),
            new FilterRule(HttpMethod.POST, "/(.*)", groupValues -> true),
            new FilterRule(HttpMethod.PATCH, "/(.*)", groupValues -> true),
            new FilterRule(HttpMethod.DELETE, "/(.*)", groupValues -> true)
        );
    }

    private Long asLong(String value) {
        if (value == null || !value.matches("^[0-9]+$")) {
            throw new BadRequestDataProblem("No, or invalid, id provided");
        }
        return Long.valueOf(value);
    }

    public PreAuthFilter(WebSecurity webSecurity) {
        this();
        this.webSecurity = webSecurity;
    }

    @Override
    public void doFilter(
            ServletRequest request,
            ServletResponse response,
            FilterChain chain) throws IOException, ServletException {

        HttpServletRequest currentRequest = (HttpServletRequest) request;
        HttpMethod method = HttpMethod.resolve(currentRequest.getMethod());
        String path = currentRequest.getServletPath();

        boolean isAuthorised = false;
        try {
            for (FilterRule rule : rules) {
                if (rule.test(method, path)) {
                    isAuthorised = true;
                    break;
                }
            }
            if (!isAuthorised) {
                throw new NotAuthorisedProblem("Not authorised");
            }
            chain.doFilter(currentRequest, response);
        } catch (Snap2SnomedProblem e) {
            ((HttpServletResponse) response).sendError(HttpServletResponse.SC_FORBIDDEN, e.getMessage());
        }
    }

    class FilterRule {

        HttpMethod method;
        String pattern;
        Predicate<String[]> predicate;

        private Pattern _pattern;

        public FilterRule(HttpMethod method, String pattern, Predicate<String[]> predicate) {
            this.method = method;
            this.pattern = pattern;
            this.predicate = predicate;
            this._pattern = Pattern.compile(this.pattern);
        }

        public boolean test(HttpMethod method, String url) {
            if (!method.equals(this.method)) {
                return false;
            }
            if (!url.matches(this.pattern)) {
                return false;
            } else {
                Matcher matcher = _pattern.matcher(url);
                boolean matches = matcher.matches();
                if (!matches) {
                    return false;
                } else if (matcher.groupCount() == 0) {
                    return this.predicate.test(new String[0]);
                } else {
                    List<String> values = new ArrayList<>();
                    for (int i = 1; i <= matcher.groupCount(); i++) {
                        values.add(matcher.group(i));
                    }
                    return this.predicate.test(values.toArray(new String[0]));
                }
            }
        }
    }

}
