output "url" {
  value       = terraform.workspace == "prod" ? "https://${var.host_name_si}/" : "https://${var.host_name}/"
  description = "The URL of the API endpoint"
}

output "kms_key_arn" {
  value       =  aws_kms_key.api.arn
  description = "Kms key to use in promtail"
}

output "api_log_group_name" {
  value       =  aws_cloudwatch_log_group.api.name
  description = "API Log Group name"
}

# We will keep old DEX Logs
output "dex_log_group_name" {
  value       =  aws_cloudwatch_log_group.dex.name
  description = "DEX Log Group name"
}
