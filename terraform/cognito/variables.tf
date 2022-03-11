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
