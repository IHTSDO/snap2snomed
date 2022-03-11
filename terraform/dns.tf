data "aws_route53_zone" "app" {
  name = "${var.zone}."
}