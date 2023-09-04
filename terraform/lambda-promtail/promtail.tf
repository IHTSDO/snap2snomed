
resource "aws_iam_role" "iam_for_lambda" {
  name = "iam_for_lambda"

  assume_role_policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Action" : "sts:AssumeRole",
        "Principal" : {
          "Service" : "lambda.amazonaws.com"
        },
        "Effect" : "Allow",
      }
    ]
  })
}

resource "aws_iam_role_policy" "logs" {
  name = "lambda-logs"
  role = aws_iam_role.iam_for_lambda.name
  policy = jsonencode({
    "Statement" : [
      {
        "Action" : [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        "Effect" : "Allow",
        "Resource" : "arn:aws:logs:*:*:*",
      },
      {
        "Action" : [
          "kms:Decrypt",
        ],
        "Effect" : "Allow",
        "Resource" : "arn:aws:kms:*:*:*",
      },
      {
        "Action" : [
          "ec2:DescribeNetworkInterfaces",
          "ec2:CreateNetworkInterface",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeInstances",
          "ec2:AttachNetworkInterface"
        ],
        "Effect" : "Allow",
        "Resource" : "*",
      }
    ]
  })
}

data "aws_iam_policy" "lambda_vpc_execution" {
  name = "AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = data.aws_iam_policy.lambda_vpc_execution.arn
}

resource "aws_cloudwatch_log_group" "lambda_promtail" {
  name              = "/aws/lambda/lambda_promtail"
  retention_in_days = 14
}

data "archive_file" "promptail" {
  type        = "zip"
  source_file  = "${path.module}/main"
  output_path = "${path.module}/lambda-promtail.zip"
}

resource "aws_lambda_function" "lambda_promtail" {
  filename      = "${path.module}/lambda-promtail.zip"
  function_name = "lambda_promtail"
  runtime       = "go1.x"
  handler       = "main"
  role          = aws_iam_role.iam_for_lambda.arn
  kms_key_arn   = var.kms_key_arn

  timeout      = 60
  memory_size  = 128

  environment {
    variables = {
      WRITE_ADDRESS   = var.write_address
      USERNAME        = var.username
      PASSWORD        = var.password
      KEEP_STREAM     = var.keep_stream
      EXTRA_LABELS    = "clustername,${format("ecs-%s",replace(var.host_name, "/[.]/", "-"))}"
      TENANT_ID       = replace(var.host_name, "/[.]/", "-")
      SKIP_TLS_VERIFY = var.skip_tls_verify
      PRINT_LOG_LINE  = var.print_log_line
    }
  }

  depends_on = [
    aws_iam_role_policy.logs,
    aws_iam_role_policy_attachment.lambda_vpc_execution,
  ]
}

resource "aws_lambda_function_event_invoke_config" "lambda_promtail_invoke_config" {
  function_name          = aws_lambda_function.lambda_promtail.function_name
  maximum_retry_attempts = 2
}

resource "aws_lambda_permission" "lambda_promtail_allow_cloudwatch" {
  statement_id  = "lambda-promtail-allow-cloudwatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_promtail.function_name
  principal     = "logs.${var.aws_region}.amazonaws.com"
}

# This block allows for easily subscribing to multiple log groups via the `log_group_names` var.
# However, if you need to provide an actual filter_pattern for a specific log group you should
# copy this block and modify it accordingly.
resource "aws_cloudwatch_log_subscription_filter" "lambdafunction_logfilter" {
  for_each        = toset(var.log_groups)
  name            = "lambdafunction_logfilter_${each.value}"
  log_group_name  = each.value
  destination_arn = aws_lambda_function.lambda_promtail.arn
  # required but can be empty string
  filter_pattern = ""
  depends_on     = [aws_iam_role_policy.logs]
}
