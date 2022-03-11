resource "aws_cognito_user_pool_domain" "pooldomain" {
  user_pool_id = aws_cognito_user_pool.userpool.id
  domain       = terraform.workspace == "prod" ? "snap-2-snomed" : "snap-2-snomed-test"
}