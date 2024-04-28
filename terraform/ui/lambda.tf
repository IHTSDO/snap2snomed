resource "aws_lambda_function" "ui" {
  provider         = aws.us-east-1
  function_name    = format("%s-AddHeaders", replace(var.host_name, "/[.]/", "-"))  
  description      = base64sha256(file("./ui/main.js"))
  role             = aws_iam_role.ui_lambda.arn
  filename         = "${path.module}/main.js.zip"
  handler          = "main.handler"
  source_code_hash = data.archive_file.ui.output_base64sha256
  runtime          = "nodejs20.x"
  publish          = true
  lifecycle {
    ignore_changes = [source_code_hash]
  }
}

data "archive_file" "ui" {
  type        = "zip"
  source_file = "${path.module}/main.js"
  output_path = "${path.module}/main.js.zip"
}

resource "aws_iam_role" "ui_lambda" {
  name               = format("%s-SiteLambdaRole", replace(var.host_name, "/[.]/", "-"))
  assume_role_policy = data.aws_iam_policy_document.ui_lambda.json
}

data "aws_iam_policy_document" "ui_lambda" {
  statement {
    effect = "Allow"
    principals {
      identifiers = ["lambda.amazonaws.com", "edgelambda.amazonaws.com"]
      type        = "Service"
    }
    actions = ["sts:AssumeRole"]
  }
}
