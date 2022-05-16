terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "4.14.0"
      configuration_aliases = [aws.us-east-1]
    }
    archive = {
      source  = "hashicorp/archive"
      version = "2.2.0"
    }
  }
}
