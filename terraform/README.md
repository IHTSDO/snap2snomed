# Terraform deployment details
This module contains the Terraform deployment used to deploy Snap2SNOMED to AWS.

## Overview
The deployment consists of the following parts
 - A Cognito user pool, configured to external identity providers with an app client configuration
 - An RDS database
 - S3 bucket with the Snap2SNOMED front end deployed statically webpacked and hosted via CloudFront
 - An ECS Fargate deployment of the Snap2Snomed back end

Terraform stores its state in a remote Terraform server.

## Running locally
These Terraform deployments are used by CI/CD server integration to deploy Snap2SNOMED. However they can be run locally for development/testing purposes.

To do so you first need to 
 - install Terraform - e.g. brew install terraform on a Mac
 - log in to AWS and get an [AWS Credentials file](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html?icmpid=docs_sso_user_portal)
 - run `terraform init` from `snap2snomed/terraform`
 - `terraform init` will ask which workspace you wish to use, which you can select interactively

There are a number of variables you need to also set, making it convenient to have a `terraform.tfvars` file in this directory (it is in the .gitignore file). However you can see from the [variables.tf](variables.tf) file the variables which need to be set.

You can then use
 - `terraform plan` to have Terraform provide you with a summary of the changes that would need to be applied to match your local changes, or
 - `terraform apply` to apply these changes to the remote infrastructure, however typically this is done by the CI/CD server
