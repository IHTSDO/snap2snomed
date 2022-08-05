terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.25.0"
    }
  }
  backend "remote" {
    hostname     = "terraform.csiro.cloud"
    organization = "OD221174-ehealth-research-centreprod-org"
    workspaces {
      prefix = "snap2snomed-"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

module "api" {
  source                           = "./api"
  aws_region                       = var.aws_region
  image                            = var.api_image
  dex_image                        = var.dex_image
  registry_username                = var.api_registry_username
  registry_password                = var.api_registry_password
  cpu                              = var.api_cpu
  memory                           = var.api_memory
  database_password                = var.api_database_password
  zone_id                          = data.aws_route53_zone.app.zone_id
  host_name                        = var.api_host_name
  host_name_si                     = var.api_host_name_si
  client_id                        = module.cognito.client_id
  jwt_issuer-uri                   = module.cognito.jwt_issuer-uri
  application_version              = var.api_application_version
  sentry_environment               = var.sentry_environment
  sentry_dsn                       = var.sentry_dsn
  sentry_dialog                    = var.sentry_dialog
  auth_domain_url                  = var.auth_domain_url
  fhir_url                         = var.fhir_url
  app_name                         = var.app_name
  production                       = var.production
  cors_allowed_origin_patterns     = var.cors_allowed_origin_patterns
  cors_allowed_headers             = var.cors_allowed_headers
  cors_allowed_methods             = var.cors_allowed_methods
  cors_maxage                      = var.cors_maxage
  user_registration_url            = var.user_registration_url
  registration_text                = var.registration_text
  main_page_text                   = var.main_page_text
  dex_client_secret                = var.dex_client_secret
  dex_crowd_url                    = var.dex_crowd_url
  dex_crowd_client_id              = var.dex_crowd_client_id
  dex_crowd_client_secret          = var.dex_crowd_client_secret
  dex_loglevel                     = var.dex_loglevel
  database_backup_retention_period = var.database_backup_retention_period
  jumpbox_ami_id                   = var.jumpbox_ami_id
}

module "ui" {
  source = "./ui"
  providers = {
    aws.us-east-1 = aws.us-east-1
  }
  aws_region   = var.aws_region
  site_path    = var.site_path
  zone_id      = data.aws_route53_zone.app.zone_id
  host_name    = var.ui_host_name
  host_name_si = var.ui_host_name_si
  production   = var.production
}

module "cognito" {
  source               = "./cognito"
  google_client_secret = var.google_oidc_client_secret
  google_client_id     = var.google_oidc_client_id
  aehrc_client_secret  = var.aehrc_oidc_client_secret
  aehrc_client_id      = var.aehrc_oidc_client_id
  host_name            = var.ui_host_name
  host_name_si         = var.ui_host_name_si
  api_url              = module.api.url
  cognito_image        = var.cognito_image
  dex_client_secret    = var.dex_client_secret
  prodlogin            = var.prodlogin
}
