resource "aws_ecs_task_definition" "dex" {
  family = format("%s-dex", replace(var.host_name, "/[.]/", "-"))
  cpu    = 256
  memory = 512
  container_definitions = jsonencode([
    {
      name      = "dex"
      image     = var.dex_image,
      essential = true
      portMappings = [
        {
          containerPort = 5556
        }
      ],
      repositoryCredentials = {
        credentialsParameter = aws_secretsmanager_secret.api.arn
      },
      environment = [
        for variable in local.dex_ecs_environment : variable
        if variable.value != ""
      ],
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.api.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "snap2snomed-dex"
        }
      }
    }
  ])
  execution_role_arn       = aws_iam_role.api.arn
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
}

resource "aws_ecs_service" "dex" {
  name                  = format("%s-dex", replace(var.host_name, "/[.]/", "-"))
  cluster               = aws_ecs_cluster.api.id
  launch_type           = "FARGATE"
  wait_for_steady_state = true
  task_definition       = aws_ecs_task_definition.dex.arn
  desired_count         = 1
  load_balancer {
    target_group_arn = aws_lb_target_group.dex.arn
    container_name   = "dex"
    container_port   = 5556
  }
  network_configuration {
    subnets = [
      aws_subnet.api_private[0].id,
      aws_subnet.api_private[1].id
    ]
    security_groups = [aws_security_group.dex.id]
  }
}

resource "aws_security_group" "dex" {
  name        = format("%s-dex-ContainerSecurityGroup", replace(var.host_name, "/[.]/", "-"))
  description = "Controls access to the dex instance for SNAP-2-SNOMED."
  vpc_id      = aws_vpc.api.id
  ingress {
    description     = "HTTP from load balancer"
    from_port       = 5556
    protocol        = "tcp"
    to_port         = 5556
    security_groups = [aws_security_group.api_lb.id]
  }
  ingress {
    from_port = 2049
    to_port   = 2049
    protocol  = "tcp"
    cidr_blocks      = [
      aws_subnet.api_private[0].cidr_block,
      aws_subnet.api_private[1].cidr_block
    ]
  }
  egress {
    description      = "All traffic"
    from_port        = 0
    to_port          = 0
    protocol         = -1
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_iam_role" "dex" {
  name               = format("%s-dex-TaskRole", replace(var.host_name, "/[.]/", "-"))
  assume_role_policy = data.aws_iam_policy_document.dex_assume.json
  inline_policy {
    name   = "Snap2SnomedDexTaskRolePolicy"
    policy = data.aws_iam_policy_document.dex.json
  }
}

data "aws_iam_policy_document" "dex" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "kms:Decrypt",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      aws_secretsmanager_secret.api.arn,
      aws_kms_key.api.arn,
      aws_cloudwatch_log_group.dex.arn,
      "${aws_cloudwatch_log_group.dex.arn}:log-stream:*"
    ]
  }
}

data "aws_iam_policy_document" "dex_assume" {
  statement {
    effect = "Allow"
    principals {
      identifiers = ["ecs-tasks.amazonaws.com"]
      type        = "Service"
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_cloudwatch_log_group" "dex" {
  name = format("%s-dex", replace(var.host_name, "/[.]/", "-"))
}
