# lambda-promtail on the supported provided.al2023 runtime.
#
# AWS blocks updates to go1.x functions from 3 March 2027, so this function
# replaces lambda_promtail (promtail.tf). Both run side by side until this one
# is verified; a follow-up change then removes lambda_promtail. Loki drops the
# exact duplicate lines while both forward the same log groups.
#
# dist/lambda-promtail-v1.0.1.zip is the unmodified release asset from
# https://github.com/grafana/lambda-promtail/releases/tag/v1.0.1. It is not in
# git: fetch-lambda-promtail.sh downloads it and checks its sha256. The build
# pipeline runs the script; run it yourself before a local plan.

locals {
  lambda_promtail_al2023_zip = "${path.module}/dist/lambda-promtail-v1.0.1.zip"
}

resource "aws_cloudwatch_log_group" "lambda_promtail_al2023" {
  name              = "/aws/lambda/lambda_promtail_al2023"
  retention_in_days = 14
}

resource "aws_lambda_function" "lambda_promtail_al2023" {
  filename         = local.lambda_promtail_al2023_zip
  source_code_hash = filebase64sha256(local.lambda_promtail_al2023_zip)
  function_name    = "lambda_promtail_al2023"
  runtime          = "provided.al2023"
  handler          = "bootstrap"
  architectures    = ["x86_64"]
  role             = aws_iam_role.iam_for_lambda.arn
  kms_key_arn      = var.kms_key_arn

  # lambda_promtail timed out at 60 seconds on large batches, and a batch is
  # dropped after the last retry.
  timeout     = 120
  memory_size = 256

  environment {
    variables = {
      WRITE_ADDRESS   = var.write_address
      USERNAME        = var.username
      PASSWORD        = var.password
      KEEP_STREAM     = var.keep_stream
      EXTRA_LABELS    = "clustername,${format("ecs-%s", replace(var.host_name, "/[.]/", "-"))}"
      TENANT_ID       = replace(var.host_name, "/[.]/", "-")
      SKIP_TLS_VERIFY = var.skip_tls_verify
      PRINT_LOG_LINE  = var.print_log_line
    }
  }

  depends_on = [
    aws_iam_role_policy.logs,
    aws_iam_role_policy_attachment.lambda_vpc_execution,
    aws_cloudwatch_log_group.lambda_promtail_al2023,
  ]
}

resource "aws_lambda_function_event_invoke_config" "lambda_promtail_al2023" {
  function_name          = aws_lambda_function.lambda_promtail_al2023.function_name
  maximum_retry_attempts = 2
}

resource "aws_lambda_permission" "lambda_promtail_al2023_allow_cloudwatch" {
  statement_id  = "lambda-promtail-al2023-allow-cloudwatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_promtail_al2023.function_name
  principal     = "logs.${var.aws_region}.amazonaws.com"
}

# A log group allows two subscription filters, so this one runs beside
# lambdafunction_logfilter.
resource "aws_cloudwatch_log_subscription_filter" "lambda_promtail_al2023" {
  for_each        = toset(var.log_groups)
  name            = "lambda_promtail_al2023_${each.value}"
  log_group_name  = each.value
  destination_arn = aws_lambda_function.lambda_promtail_al2023.arn
  filter_pattern  = ""
  depends_on      = [aws_lambda_permission.lambda_promtail_al2023_allow_cloudwatch]
}
