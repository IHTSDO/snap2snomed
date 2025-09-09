output "url" {
  value       = "https://${var.host_name}/"
  description = "The domain where the UI is hosted"
}

output "cloudfront_id" {
  value       = aws_cloudfront_distribution.ui.id
  description = "Cloudfront distribution ID"
}

output "maintenance_website_endpoint" {
  value = aws_s3_bucket_website_configuration.maintenance.website_endpoint
  description = "Maintenance Redirect Bucket Website Endpoint"
}