variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "write_address" {
  type        = string
  description = "This is the Loki Write API compatible endpoint that you want to write logs to, either promtail or Loki."
  default     = "https://loki.url/api/v1/push"
}

variable "username" {
  type        = string
  description = "The basic auth username, necessary if writing directly to Grafana Cloud Loki."
  default     = ""
}

variable "password" {
  type        = string
  description = "The basic auth password, necessary if writing directly to Grafana Cloud Loki."
  sensitive   = true
  default     = ""
}

variable "keep_stream" {
  type        = string
  description = "Determines whether to keep the CloudWatch Log Stream value as a Loki label when writing logs from lambda-promtail."
  default     = "false"
}

variable "print_log_line" {
  type        = string
  description = "Determines whether we want the lambda to output the parsed log line before sending it on to promtail. Value needed to disable is the string 'false'"
  default     = "false"
}

variable "batch_size" {
  type        = string
  description = "Determines when to flush the batch of logs (bytes)."
  default     = ""
}

variable "skip_tls_verify" {
  type        = string
  description = "Determines whether to verify the TLS certificate"
  default     = "false"
}

variable "kms_key_arn" {
  type        = string
  description = "Kms key to use in promtail"
}

variable "host_name" {
  description = "Host name of the UI"
  type        = string
}

variable "log_groups" {
  description = "Log groups to include"
  type        = list(string)
}
