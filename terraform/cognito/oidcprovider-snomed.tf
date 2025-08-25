resource "aws_cognito_identity_provider" "SNOMEDINTERNATIONAL" {
  user_pool_id  = aws_cognito_user_pool.userpool.id
  provider_name = "SNOMEDINTERNATIONAL"
  provider_type = "OIDC"
  provider_details = {
    attributes_request_method = "GET"
    oidc_issuer               = var.snomed_idp_url
    authorize_scopes          = "profile openid email"
    client_id                 = var.snomed_client_id
    client_secret             = var.snomed_client_secret
  }
  attribute_mapping = {
    email          = "email"
    email_verified = "email_verified"
    given_name     = "given_name"
    family_name    = "family_name"
    username       = "sub"
  }
}