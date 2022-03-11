resource "aws_route53_record" "api" {
  zone_id = var.zone_id
  name    = var.host_name
  type    = "A"
  alias {
    name                   = aws_lb.api.dns_name
    zone_id                = aws_lb.api.zone_id
    evaluate_target_health = false
  }
}