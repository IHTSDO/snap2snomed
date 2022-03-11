resource "aws_cognito_identity_provider" "googleoidc" {
  user_pool_id = aws_cognito_user_pool.userpool.id
  provider_name = "Google"
  provider_type = "Google"
  provider_details = {
    authorize_scopes              = "email openid profile"
    client_id                     = var.google_client_id
    client_secret                 = var.google_client_secret
    attributes_url                = "https://people.googleapis.com/v1/people/me?personFields="
    attributes_url_add_attributes = "true"
    authorize_url                 = "https://accounts.google.com/o/oauth2/v2/auth"
    oidc_issuer                   = "https://accounts.google.com"
    token_request_method          = "POST"
    token_url                     = "https://www.googleapis.com/oauth2/v4/token"
  }
  attribute_mapping = {
    email          = "email"
    email_verified = "email_verified"
    given_name     = "given_name"
    family_name    = "family_name"
    username       = "sub"
  }
}