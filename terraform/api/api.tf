resource "aws_ecs_cluster" "api" {
  name               = replace(var.host_name, "/[.]/", "-")
  capacity_providers = ["FARGATE"]
}

resource "aws_ecs_task_definition" "api" {
  family = replace(var.host_name, "/[.]/", "-")
  cpu    = var.cpu
  memory = var.memory
  container_definitions = jsonencode([{
    name      = "api"
    image     = var.image
    essential = true
    portMappings = [{
      containerPort = 8080
    }],
    repositoryCredentials = {
      credentialsParameter = aws_secretsmanager_secret.api.arn
    },
    environment = [
      for variable in local.api_ecs_environment : variable
      if variable.value != "" 
    ]
    logConfiguration = {
      logDriver = "awslogs",
      options = {
        awslogs-group         = aws_cloudwatch_log_group.api.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "snap2snomed"
      }
    }
  }])
  execution_role_arn       = aws_iam_role.api.arn
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
}

resource "aws_ecs_service" "api" {
  name            = replace(var.host_name, "/[.]/", "-")
  cluster         = aws_ecs_cluster.api.id
  launch_type     = "FARGATE"
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8080
  }
  network_configuration {
    subnets = [
      aws_subnet.api_private[0].id,
      aws_subnet.api_private[1].id
    ]
    security_groups = [aws_security_group.api.id]
  }
}

resource "aws_security_group" "api" {
  name        = format("%s-ContainerSecurityGroup", replace(var.host_name, "/[.]/", "-"))
  description = "Controls access to the container for the SNAP-2-SNOMED API."
  vpc_id      = aws_vpc.api.id
  ingress {
    description     = "HTTP from load balancer"
    from_port       = 8080
    protocol        = "tcp"
    to_port         = 8080
    security_groups = [aws_security_group.api_lb.id]
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

resource "aws_iam_role" "api" {
  name               = format("%s-TaskRole", replace(var.host_name, "/[.]/", "-"))
  assume_role_policy = data.aws_iam_policy_document.api_assume.json
  inline_policy {
    name   = "Snap2SnomedApiTaskRolePolicy"
    policy = data.aws_iam_policy_document.api.json
  }
}

data "aws_iam_policy_document" "api" {
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
      aws_cloudwatch_log_group.api.arn,
      "${aws_cloudwatch_log_group.api.arn}:log-stream:*"
    ]
  }
}

data "aws_iam_policy_document" "api_assume" {
  statement {
    effect = "Allow"
    principals {
      identifiers = ["ecs-tasks.amazonaws.com"]
      type        = "Service"
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_secretsmanager_secret" "api" {
  name                    = format("%s-ImageRegistryCredential", replace(var.host_name, "/[.]/", "-"))
  kms_key_id              = aws_kms_key.api.id
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "api" {
  secret_id = aws_secretsmanager_secret.api.id
  secret_string = jsonencode({
    username = var.registry_username,
    password = var.registry_password
  })
}

resource "aws_kms_key" "api" {
  description = format("SNAP-2-SNOMED %s", var.host_name)

}

resource "aws_cloudwatch_log_group" "api" {
  name = replace(var.host_name, "/[.]/", "-")
}
