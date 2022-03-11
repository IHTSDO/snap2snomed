resource "aws_cognito_user_group" "admingroup" {
  name         = "AdminGroup"
  description  = "Snap2Snomed Admin Users"
  user_pool_id = aws_cognito_user_pool.userpool.id
}