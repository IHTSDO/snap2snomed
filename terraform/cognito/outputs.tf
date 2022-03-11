output "client_id" {
  value       = aws_cognito_user_pool_client.appclient.id
  description = "Cognito App Client ID"
}

output "jwt_issuer-uri" {
  value       = aws_cognito_user_pool.userpool.endpoint
  description = "Cognito JWT issuer URI for the User Pool"
}
