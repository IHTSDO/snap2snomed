variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "site_path" {
  description = "The path to the built UI"
  type        = string
}

variable "zone_id" {
  description = "Route 53 zone ID"
  type        = string
}

variable "host_name" {
  description = "Host name at which the UI will be accessible"
  type        = string
}

variable "host_name_si" {
  description = "Host name at which the UI will be accessible"
  type        = string
}

variable "production" {
  description = "Production boolean flag for the front end"
  type        = string
}