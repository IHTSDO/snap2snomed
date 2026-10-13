
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
