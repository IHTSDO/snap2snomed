resource "aws_acm_certificate" "ui" {
  provider          = aws.us-east-1
  domain_name       = var.host_name
  validation_method = "DNS"
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate" "ui_si" {
  provider          = aws.us-east-1
  domain_name       = var.host_name_si
  validation_method = "DNS"
  lifecycle {
    create_before_destroy = true
  }
  count = terraform.workspace == "prod" ? 1 : 0
}

resource "aws_route53_record" "ui_validation" {
  for_each = {
    for dvo in aws_acm_certificate.ui.domain_validation_options : dvo.domain_name => {
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

resource "aws_acm_certificate_validation" "ui" {
  provider                = aws.us-east-1
  certificate_arn         = aws_acm_certificate.ui.arn
  validation_record_fqdns = [for record in aws_route53_record.ui_validation : record.fqdn]
}
