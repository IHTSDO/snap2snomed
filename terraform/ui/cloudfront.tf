locals {
  origin_id = format("%s-ui-origin", replace(terraform.workspace == "prod" ? var.host_name_si : var.host_name, "/[.]/", "-"))
}

locals {
  maint_origin_id = format("%s-maintenance-origin", replace(terraform.workspace == "prod" ? var.host_name_si : var.host_name, "/[.]/", "-"))
}

resource "aws_cloudfront_distribution" "ui" {
  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_All"
  default_root_object = "index.html"
  aliases             = [terraform.workspace == "prod" ? var.host_name_si : var.host_name]
  viewer_certificate {
    acm_certificate_arn      = terraform.workspace == "prod" ? aws_acm_certificate.ui_si[0].arn : aws_acm_certificate_validation.ui.certificate_arn
    minimum_protocol_version = "TLSv1.2_2019"
    ssl_support_method       = "sni-only"
  }
  origin {
    domain_name = aws_s3_bucket.ui.bucket_regional_domain_name
    origin_id   = local.origin_id
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.ui.cloudfront_access_identity_path
    }
  }
  origin {
    domain_name = aws_s3_bucket_website_configuration.maintenance.website_endpoint
    origin_id   = local.maint_origin_id
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.origin_id
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 31536000
    compress               = true
    forwarded_values {
      query_string = false
      headers      = []
      cookies {
        forward = "none"
      }
    }
    lambda_function_association {
      event_type = "origin-response"
      lambda_arn = aws_lambda_function.ui.qualified_arn
    }
  }
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  depends_on = [aws_lambda_function.ui]
}

resource "aws_cloudfront_origin_access_identity" "ui" {
  comment = format("OAI for %s SNAP-2-SNOMED UI distribution", replace(terraform.workspace == "prod" ? var.host_name_si : var.host_name, "/[.]/", "-"))
}
