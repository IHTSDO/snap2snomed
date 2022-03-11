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

"use strict";

/**
* Add extra headers to the responses
*/

exports.handler = function(event, _, callback) {
  const response = event.Records[0].cf.response;
  response.headers = {
    ...response.headers,
    "strict-transport-security": [{
      value: "max-age=63072000; preload"
    }],
    "x-frame-options": [{
      value: "SAMEORIGIN"
    }],
    "x-content-type-options": [{
      value: "nosniff"
    }],
    "x-xss-protection": [{
      value: "1; mode=block"
    }],
    "expect-ct": [{
      key: "Expect-CT",
      value: "max-age=604800, enforce, report-uri=https://snap2snomed.report-uri.com/r/d/ct/enforce"
    }],
    "referrer-policy": [{
      value: "no-referrer"
    }],
    "permissions-policy": [{
      value: "accelerometer=(self), autoplay=(self), camera=(self), display-capture=(self), document-domain=(self), encrypted-media=(self), fullscreen=(self), geolocation=(self), gyroscope=(self), magnetometer=(self), microphone=(self), midi=(self), payment=(self), picture-in-picture=(self), sync-xhr=(self), usb=(self), xr-spatial-tracking=(self)"
    }],
    "content-security-policy": [{
      key:   'Content-Security-Policy',
      value: "default-src 'self'  https://snap.snomedtools.org  https://*.snap.snomedtools.org https://snap2snomed.app https://*.snap2snomed.app https://ihtsdo.freshdesk.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'  https://snap.snomedtools.org  https://*.snap.snomedtools.org https://snap2snomed.app https://*.snap2snomed.app https://d18k7b2git647n.cloudfront.net https://*.sentry.io https://browser.sentry-cdn.com https://js.sentry-cdn.com; connect-src 'self'  https://snap.snomedtools.org  https://*.snap.snomedtools.org https://snap2snomed.app https://*.snap2snomed.app https://snap2snomed.report-uri.com https://tx.ontoserver.csiro.au https://r4.ontoserver.csiro.au https://auth.ontoserver.csiro.au https://accounts.google.com https://*.auth.eu-central-1.amazoncognito.com https://*.auth.ap-southeast-2.amazoncognito.com https://sentry.io https://*.sentry.io; img-src 'self' https://d18k7b2git647n.cloudfront.net https://www.gravatar.com; style-src 'self' 'unsafe-inline' https://d18k7b2git647n.cloudfront.net https://fonts.googleapis.com/; object-src 'none'; upgrade-insecure-requests; report-uri https://snap2snomed.report-uri.com/r/d/csp/enforce"
    }]
  };
  callback(null, response);
};

