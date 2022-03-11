resource "aws_route53_record" "ui" {
  zone_id = var.zone_id
  name    = var.host_name
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.ui.domain_name
    zone_id                = aws_cloudfront_distribution.ui.hosted_zone_id
    evaluate_target_health = false
  }
}