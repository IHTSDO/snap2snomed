output "url" {
  value       = terraform.workspace == "prod" ? "https://${var.host_name_si}/" : "https://${var.host_name}/"
  description = "The URL of the API endpoint"
}
