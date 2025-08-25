variable "google_client_secret" {
  description = "Google OAuth2 Client Secret"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth2 Client ID"
  type        = string
  sensitive   = true
}

variable "aehrc_client_secret" {
  description = "AEHRC OAuth2 Client Secret"
  type        = string
  sensitive   = true
}

variable "aehrc_client_id" {
  description = "AEHRC OAuth2 Client ID"
  type        = string
  sensitive   = true
}

variable "host_name" {
  description = "Host name for Cognito configuration naming"
  type        = string
}

variable "host_name_si" {
  description = "Host name for Cognito configuration naming"
  type        = string
}

variable "api_url" {
  description = "API URL for configuration of dex provider"
  type        = string
}

variable "cognito_image" {
  description = "Image path for cognito customisation logo"
  type        = string
}

variable "dex_client_secret" {
  description = "Client secret for Dex IDP"
  type        = string
  sensitive   = true
}

variable "prodlogin" {
  description  = "Is this deployment production"
  type        = bool
}

variable "expected_idp_name" {
  description = "Cognito IdP provider name to link (must match the IdP name in the pool)"
  type        = string
  default     = "SNOMEDINTERNATIONAL"
}

variable "expected_snomed_idp_name" {
  description = "Cognito IdP provider name to link (must match the IdP name in the pool)"
  type        = string
  default     = "SNOMED"
}

variable "require_verified_email" {
  description = "Only link when email_verified is true"
  type        = bool
  default     = true
}

variable "snomed_idp_url" {
  description = "SI Keycloak URL"
  type        = string
}

variable "snomed_client_secret" {
  description = "SI OAuth2 Client Secret"
  type        = string
  sensitive   = true
}

variable "snomed_client_id" {
  description = "SI OAuth2 Client ID"
  type        = string
  sensitive   = true
}

