variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "image" {
  description = "Image repository"
  type        = string
}

variable "dex_image" {
  description = "Dex image repository"
  type        = string
}

variable "registry_username" {
  description = "Username for authenticating to image repository"
  type        = string
}

variable "registry_password" {
  description = "Username for authenticating to image repository"
  type        = string
  sensitive   = true
}

variable "cpu" {
  description = "Reserved CPU units"
  type        = number
  default     = 4096
}

variable "memory" {
  description = "Reserved memory units"
  type        = number
  default     = 8192
}

variable "database_user" {
  description = "User for accessing the database"
  type        = string
  sensitive   = true
  default     = "snap2snomed"
}

variable "database_password" {
  description = "Password for accessing the database"
  type        = string
  sensitive   = true
}

variable "zone_id" {
  description = "Route 53 zone ID"
  type        = string
}

variable "host_name" {
  description = "Host name at which the API will be accessible"
  type        = string
}

variable "host_name_si" {
  description = "Host name at which the API will be accessible"
  type        = string
}

variable "client_id" {
  description = "Cognito App Client ID"
  type        = string
}

variable "jwt_issuer-uri" {
  description = "Cognito JWT Issuer uri for required API parameter"
  type        = string
}

variable "application_version" {
  description = "Application version for Swagger UI"
  type        = string
}

variable "sentry_dsn" {
  description = "DSN to raise errors with Sentry"
  type        = string
}

variable "sentry_environment" {
  description = "Sentry environment"
  type        = string
}

variable "sentry_dialog" {
  description = "Indicates whether Sentry should pop a dialog on error"
  type        = string
}

variable "auth_domain_url" {
  description = "Base URL for auth"
  type        = string
}

variable "fhir_url" {
  description = "Default FHIR server URL"
  type        = string
}

variable "app_name" {
  description = "Application name configuration for the front end"
  type        = string
}

variable "production" {
  description = "Production boolean flag for the front end"
  type        = string
}

variable "cors_allowed_origin_patterns" {
  description = "CORS Allowed origins"
  type        = string
}

variable "cors_allowed_headers" {
  description = "CORS Allowed headers"
  type        = string
}

variable "cors_allowed_methods" {
  description = "CORS Allowed Methods"
  type        = string
}

variable "cors_maxage" {
  description = "CORS MaxAge"
  type        = string
}

variable "dex_client_secret" {
  description = "Client secret for Dex IDP"
  type        = string
  sensitive   = true
}

variable "dex_crowd_url" {
  description = "Crowd URL for Dex IDP"
  type        = string
}

variable "dex_crowd_client_id" {
  description = "Crowd client ID for Dex IDP"
  type        = string
}

variable "dex_crowd_client_secret" {
  description = "Crowd client secret for Dex IDP"
  type        = string
  sensitive   = true
}

variable "database_backup_retention_period" {
  description = "Database backup retention period"
  type        = number
}

variable "jumpbox_ami_id" {
  description = "This is the jumpbox ami ID"
  type        = string
}

variable "user_registration_url" {
  description = "URL to reference for registration"
  type        = string
}

variable "registration_text" {
  description = "Text to accompany registration URL"
  type        = string
}

variable "main_page_text" {
  description = "Blurb about the instance"
  type        = string
}

variable "dex_loglevel" {
  description = "Log level for DEX"
  type        = string
}

variable "identity_provider" {
  description = "Identity provider"
  type        = string
}

variable "force_dex_deployment" {
  description = "Force DEX ECS service redeployment"
  type        = bool
}
