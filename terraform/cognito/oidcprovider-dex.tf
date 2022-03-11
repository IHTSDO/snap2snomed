resource "aws_cognito_identity_provider" "dex" {
  user_pool_id  = aws_cognito_user_pool.userpool.id
  provider_name = "SNOMED"
  provider_type = "OIDC"
  provider_details = {
    attributes_request_method = "GET"
    oidc_issuer               = format("%sidp/dex", var.api_url)
    authorize_scopes          = "profile openid email"
    client_id                 = "snap2snomed"
    client_secret             = var.dex_client_secret
  }
  attribute_mapping = {
    email          = "email"
    email_verified = "email_verified"
    given_name     = "given_name"
    family_name    = "family_name"
    username       = "sub"
  }
}