resource "aws_lb" "api" {
  name               = replace(var.host_name, "/[.]/", "-")
  internal           = false
  idle_timeout       = 480
  load_balancer_type = "application"
  subnets = [
    aws_subnet.api_public[0].id,
    aws_subnet.api_public[1].id
  ]
  security_groups = [
    aws_vpc.api.default_security_group_id,
    aws_security_group.api_lb.id
  ]
}

resource "aws_lb_target_group" "api" {
  port        = 8080
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.api.id
  health_check {
    path     = "/actuator/health"
    port     = 8080
    protocol = "HTTP"
  }
}

resource "aws_lb_listener" "api" {
  load_balancer_arn = aws_lb.api.arn
  port              = "443"
  protocol          = "HTTPS"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  certificate_arn = terraform.workspace == "prod" ? aws_acm_certificate.api_si[0].arn : aws_acm_certificate_validation.api.certificate_arn
}

resource "aws_lb_listener_certificate" "api_si" {
  listener_arn    = aws_lb_listener.api.arn
  certificate_arn = aws_acm_certificate_validation.api.certificate_arn
  count = terraform.workspace == "prod" ? 1 : 0
}


resource "aws_lb_listener_rule" "dex" {
  listener_arn = aws_lb_listener.api.arn
  condition {
    path_pattern {
      values = ["/idp/*"]
    }
  }
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.dex.arn
  }
}

resource "aws_security_group" "api_lb" {
  name        = format("%s-AlbSecurityGroup", replace(var.host_name, "/[.]/", "-"))
  description = "Controls access to the load balancer for the SNAP-2-SNOMED API."
  vpc_id      = aws_vpc.api.id
  ingress {
    description      = "TLS from anywhere"
    from_port        = 443
    protocol         = "tcp"
    to_port          = 443
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
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

resource "aws_lb_target_group" "dex" {
  port        = 5556
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.api.id
  health_check {
    path     = "/idp/dex/.well-known/openid-configuration"
    port     = 5556
    protocol = "HTTP"
  }
}
