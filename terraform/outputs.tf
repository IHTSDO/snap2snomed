output "api_url" {
  value       = module.api.url
  description = "The URL of the API endpoint"
}

output "ui_url" {
  value       = module.ui.url
  description = "The URL of the UI endpoint"
}

output "cloudfront_distro_id" {
  value       = module.ui.cloudfront_id
  description = "Cloudfront Distribution id"
}
