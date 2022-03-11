package org.snomed.snap2snomed.integration;

import static org.mockserver.integration.ClientAndServer.startClientAndServer;
import static org.mockserver.model.HttpRequest.request;
import static org.mockserver.model.HttpResponse.response;

import org.mockserver.integration.ClientAndServer;
import org.mockserver.model.MediaType;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@Component
public class MockAuthorizationServer {

  public static final String KEY_ID = "rn6gS6jbxwFC1mDnXfCQRzAwS1RxySf5pDag2pMMgug";
  private static final int MOCK_SERVER_PORT = 1080;
  
  @Bean(destroyMethod = "stop")
  public ClientAndServer mockAuthServer() {
    ClientAndServer client = startClientAndServer(MOCK_SERVER_PORT);
    String url = "http://localhost:" + MOCK_SERVER_PORT;
    client.when(request()
            .withPath("/.well-known/openid-configuration"))
        .respond(response().withContentType(MediaType.APPLICATION_JSON)
            .withBody(
                "{\"authorization_endpoint\":\"" + url
                    + "/authorize\",\"id_token_signing_alg_values_supported\":[\"RS256\"],\"issuer\":\"" + url
                    + "\",\"jwks_uri\":\"" + url
                    + "/.well-known/jwks.json\",\"response_types_supported\":[\"code\",\"token\"],\"scopes_supported\":[\"openid\",\"email\",\"phone\",\"profile\"],\"subject_types_supported\":[\"public\"],\"token_endpoint\":\""
                    + url
                    + "/token\",\"token_endpoint_auth_methods_supported\":[\"client_secret_basic\",\"client_secret_post\"],\"userinfo_endpoint\":\""
                    + url + "/userInfo\"}"));
    client
        .when(request()
            .withPath("/.well-known/jwks.json"))
        .respond(response().withContentType(MediaType.APPLICATION_JSON)
            .withBody(
                "{\"keys\":[{\"kty\":\"RSA\",\"e\":\"AQAB\",\"use\":\"sig\",\"kid\":\"" + KEY_ID
                    + "\",\"alg\":\"RS256\",\"n\":\"hjgQ4W6QjPvNUnmfwRHGVFKzkyJDMnPD7Ln9LDeCg3Z3ykF9HIx_VawbeEYR52Vb2bFKpLOqKVrsoaTSKocKYT1EJ3HOSrGmXTTHhsy8nG7rk5zQ7O8kDKzI0cAN1V1WzkHCD5wX1zBOI3ejn8xlx-4tS1QjAoltHaaMjXx4pOtegUIMYocuHcwahtsFseWowGHiRHsBvuN3ZJn58g13a62s5alGO_2FOQvfuFUsxLN6ZcLGHFTDjP3GOlngKr3sJ8iehs-B7XTPA7mRiNMxWptBQHhCN5Nz2KZQon6B_cUeW07BenqjAHcssmSh04p_kocn7KzN3v0l8l5EmB0rPw\"}]}"));
    return client;
  }

}
