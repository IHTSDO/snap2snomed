terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "4.12.1"
      configuration_aliases = [aws.us-east-1]
    }
    archive = {
      source  = "hashicorp/archive"
      version = "2.2.0"
    }
  }
}
