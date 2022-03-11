resource "aws_acm_certificate" "api" {
  domain_name       = var.host_name
  validation_method = "DNS"
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate" "api_si" {
  domain_name       = var.host_name_si
  validation_method = "DNS"
  lifecycle {
    create_before_destroy = true
  }
  count = terraform.workspace == "prod" ? 1 : 0
}

resource "aws_route53_record" "api_validation" {
  for_each = {
    for dvo in aws_acm_certificate.api.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }
  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.zone_id
}

resource "aws_acm_certificate_validation" "api" {
  certificate_arn         = aws_acm_certificate.api.arn
  validation_record_fqdns = [for record in aws_route53_record.api_validation : record.fqdn]
}
