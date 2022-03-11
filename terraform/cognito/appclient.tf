resource "aws_cognito_user_pool_client" "appclient" {
  user_pool_id          = aws_cognito_user_pool.userpool.id
  access_token_validity = 60
  allowed_oauth_flows = [
    "code",
  ]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes = [
    "email",
    "openid",
    "profile",
  ]
  callback_urls = [
    "https://localhost:4200",
    "https://snap2snomed.app",
    "https://snap.snomedtools.org",
    "https://dev.snap2snomed.app",
    "https://oauth.pstmn.io/v1/callback"
  ]
  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]
  id_token_validity = 60
  logout_urls = [
    "https://localhost:4200/",
    "https://snap.snomedtools.org/",
    "https://snap2snomed.app/",
    "https://dev.snap2snomed.app/"
  ]
  name = "Snap2Snomed"
  read_attributes = [
    "address",
    "birthdate",
    "email",
    "email_verified",
    "family_name",
    "gender",
    "given_name",
    "locale",
    "middle_name",
    "name",
    "nickname",
    "phone_number",
    "phone_number_verified",
    "picture",
    "preferred_username",
    "profile",
    "updated_at",
    "website",
    "zoneinfo",
  ]
  supported_identity_providers = var.prodlogin != true ? [
        aws_cognito_identity_provider.dex.provider_name,
        aws_cognito_identity_provider.googleoidc.provider_name,
        aws_cognito_identity_provider.AEHRC.provider_name
      ] : [
        aws_cognito_identity_provider.dex.provider_name
      ]

  write_attributes = [
    "email",
    "family_name",
    "given_name",
  ]

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}
