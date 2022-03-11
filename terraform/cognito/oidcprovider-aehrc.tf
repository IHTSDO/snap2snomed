resource "aws_cognito_identity_provider" "AEHRC" {
  user_pool_id  = aws_cognito_user_pool.userpool.id
  provider_name = "AEHRC"
  provider_type = "OIDC"
  provider_details = {
    attributes_request_method = "GET"
    oidc_issuer               = "https://auth.ontoserver.csiro.au/auth/realms/aehrc"
    authorize_scopes          = "profile openid"
    client_id                 = var.aehrc_client_id
    client_secret             = var.aehrc_client_secret
  }
  attribute_mapping = {
    email          = "email"
    email_verified = "email_verified"
    given_name     = "given_name"
    family_name    = "family_name"
    username       = "sub"
  }
}