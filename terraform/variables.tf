variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "api_image" {
  description = "Image repository for the API"
  type        = string
  default     = "ontoserver.azurecr.io/snap2snomed:main"
}

variable "dex_image" {
  description = "Image repository for dex"
  type        = string
  default     = "ontoserver.azurecr.io/aehrc/dex:latest"
}

variable "api_registry_username" {
  description = "Username for authenticating to API image repository"
  type        = string
  sensitive   = true
}

variable "api_registry_password" {
  description = "Username for authenticating to API image repository"
  type        = string
  sensitive   = true
}

variable "api_cpu" {
  description = "Reserved CPU units for API"
  type        = number
  default     = 4096
}

variable "api_memory" {
  description = "Reserved memory units for API"
  type        = number
  default     = 8192
}

variable "api_database_password" {
  description = "Password for accessing the database"
  type        = string
  sensitive   = true
}

variable "domain" {
  description = "Second-level domain used for the zone"
  type        = string
}

variable "zone" {
  description = "Second-level domain used for the zone"
  type        = string
}

variable "api_host_name" {
  description = "Host name at which the API will be accessible"
  type        = string
}

variable "api_host_name_si" {
  description = "Host name at which the API will be accessible"
  type        = string
}

variable "ui_host_name" {
  description = "Host name at which the UI will be accessible"
  type        = string
}

variable "ui_host_name_si" {
  description = "Host name at which the UI will be accessible"
  type        = string
}

variable "site_path" {
  description = "The path to the built UI"
  type        = string
  default     = "../ui/snapclient/dist/snapclient"
}

variable "google_oidc_client_secret" {
  description = "Google OAuth2 Client Secret"
  type        = string
  sensitive   = true
}

variable "google_oidc_client_id" {
  description = "Google OAuth2 Client ID"
  type        = string
  sensitive   = true
}

variable "aehrc_oidc_client_secret" {
  description = "AEHRC OAuth2 Client Secret"
  type        = string
  sensitive   = true
}

variable "aehrc_oidc_client_id" {
  description = "AEHRC OAuth2 Client ID"
  type        = string
  sensitive   = true
}

variable "api_application_version" {
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
  default     = "false"
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
  default     = "Snap2SNOMED"
}

variable "production" {
  description = "Production boolean flag for the front end"
  type        = string
  default     = "true"
}

variable "cognito_image" {
  description = "Image path for cognito customisation logo"
  type        = string
  default     = "../images/SNOMED_Snap_Cognito.png"
}

variable "cors_allowed_origin_patterns" {
  description = "CORS Allowed origins"
  type        = string
  default     = ""
}

variable "cors_allowed_headers" {
  description = "CORS Allowed headers"
  type        = string
  default     = ""
}

variable "cors_allowed_methods" {
  description = "CORS Allowed Methods"
  type        = string
  default     = ""
}

variable "cors_maxage" {
  description = "CORS MaxAge"
  type        = string
  default     = ""
}

variable "dex_client_secret" {
  description = "Client secret for Dex IDP"
  type        = string
  sensitive   = true
}

variable "dex_crowd_url" {
  description = "Crowd URL for Dex IDP"
  type        = string
  default     = "https://dev-crowd.ihtsdotools.org/crowd"
}

variable "dex_crowd_client_id" {
  description = "Crowd client ID for Dex IDP"
  type        = string
  default     = "csiro-dex"
}

variable "dex_crowd_client_secret" {
  description = "Crowd client secret for Dex IDP"
  type        = string
  sensitive   = true
}

variable "database_backup_retention_period" {
  description = "Database backup retention period"
  type        = number
  default     = 1
}

variable "prodlogin" {
  description  = "Is this deployment production"
  type        = bool
  default     = false
}

variable "jumpbox_ami_id" {
  description = "This is the jumpbox ami ID"
  type        = string
  default     = "ami-0186908e2fdeea8f3"
}

variable "user_registration_url" {
  description = "URL to reference for registration"
  type        = string
  default     = "http://snomed.org/account-apply"
}

variable "registration_text" {
  description = "Text to accompany registration URL"
  type        = string
  default     = "To log in you need a SNOMED International account, which you can freely request at "
}

variable "main_page_text" {
  description = "Blurb about the instance"
  type        = string
  default     = "Snap2SNOMED is currently not yet in production. For more information on this application, please visit <a href=\"http://snomed.org/mtug\" rel=\"external\">snomed.org/mtug</a> or contact <a href=\"mailto:info@snomed.org\">info@snomed.org</a>"
}

variable "dex_loglevel" {
  description = "Log level for DEX"
  type        = string
  default     = "info"
}

variable "identity_provider" {
  description = "Identity provider"
  type        = string
  default     = ""
}

variable "force_dex_deployment" {
  description = "Force DEX ECS redeployment"
  type        = bool
  default     = false
}

variable "loki_username" {
  description = "Loki service username"
  type        = string
  sensitive   = true
}

variable "loki_password" {
  description = "Loki service password"
  type        = string
  sensitive   = true
}
