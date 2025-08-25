locals {
  lambda_name = format("%s-PreSignUp", replace(var.host_name, "/[.]/", "-"))
}

data "archive_file" "pre_signup_zip" {
  type        = "zip"
  source_dir  = "${path.module}/pre_signup_lambda"
  output_path = "${path.module}/pre_signup.zip"
}

resource "aws_lambda_function" "pre_signup" {
  function_name    = local.lambda_name
  role             = aws_iam_role.pre_signup_role.arn
  runtime          = "nodejs18.x"
  handler          = "pre_signup_lambda.handler"
  filename         = data.archive_file.pre_signup_zip.output_path
  source_code_hash = data.archive_file.pre_signup_zip.output_base64sha256
  timeout          = 10
  memory_size      = 256

  environment {
    variables = {
      EXPECTED_IDP_NAME        = var.expected_idp_name
      EXPECTED_SNOMED_IDP_NAME = var.expected_snomed_idp_name
      REQUIRE_VERIFIED_EMAIL   = var.require_verified_email ? "true" : "false"
    }
  }
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "pre_signup_role" {
  name               = "${local.lambda_name}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}


resource "aws_iam_role_policy" "pre_signup_policy" {
  name = "${local.lambda_name}-policy"
  role = aws_iam_role.pre_signup_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      { Effect="Allow", Action=["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"], Resource="*" },
      { Effect="Allow", Action=["cognito-idp:ListUsers","cognito-idp:AdminLinkProviderForUser"], Resource="*" }
    ]
  })
}

resource "aws_lambda_permission" "allow_cognito" {
  statement_id  = "AllowExecutionFromCognito"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_signup.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.userpool.arn
}
