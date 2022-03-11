resource "aws_s3_bucket" "ui" {
  bucket = format("%s-ui-bucket", replace(var.host_name, "/[.]/", "-"))
}

resource "aws_s3_bucket_public_access_block" "ui" {
  bucket                  = aws_s3_bucket.ui.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "ui" {
  bucket = aws_s3_bucket.ui.id
  policy = data.aws_iam_policy_document.ui_bucket_policy.json
}

data "aws_iam_policy_document" "ui_bucket_policy" {
  statement {
    effect = "Allow"
    principals {
      identifiers = [aws_cloudfront_origin_access_identity.ui.iam_arn]
      type        = "AWS"
    }
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.ui.arn}/*"]
  }
}

/*
  The UI files hosted in S3 are split into 3 groups:
   - ui_file_nocache :    Files that will have no-cache header so the local browser will not cache them.
                          We expect these files to change frequently from deployment to deployment.
                          (example: index.html or en.json file that contains translations)
                          The files to include in this group are listed in the no_cache_files list

   - ui_file_short_cache: Files that will be cached for short amount of time (1 day)
                          We expect these files to change but not too frequently or the files are not
                          essential for the application.
                          (example: favicon.ico)
                          The files to include in this group are listed in the short_cache_files list

   - ui_file_static:      These files will be cached for a long time (1 year)
                          We expect these files to not change at all or files that will change names
                          between deployments.
                          (example: runtime.*.js)
                          All the files not includec in the no_cache or short_cache list are
                          included in this group
*/

locals {
  mime_types = {
    ".html"        = "text/html"
    ".js"          = "application/javascript"
    ".css"         = "text/css"
    ".png"         = "image/png"
    ".xml"         = "application/xml"
    ".json"        = "application/json"
    ".svg"         = "image/svg+xml"
    ".ico"         = "image/x-icon"
    ".txt"         = "text/plain"
    ".webmanifest" = "application/manifest+json"
  }
  no_cache_files = [
    "index.html",
    "assets/i18n/*.json",
    "assets/img/*.png",
    "assets/css/*.css",
    "assets/*.json",
  ]
  no_cache_fileset = flatten([
      for key in local.no_cache_files : [
        for file in fileset(var.site_path, key) : file ]
  ])
  short_cache_files = [
    "favicon.ico",
    "3rdpartylicenses.txt"
  ]
  short_cache_fileset = flatten([
      for key in local.short_cache_files : [
        for file in fileset(var.site_path, key) : file ]
  ])

}

resource "aws_s3_bucket_object" "ui_file_nocache" {
  for_each      = toset([
    for file in local.no_cache_fileset : file
  ])
  bucket        = aws_s3_bucket.ui.id
  key           = each.value
  source        = "${var.site_path}/${each.value}"
  etag          = filemd5("${var.site_path}/${each.value}")
  cache_control = "no-cache"
  content_type  = lookup(local.mime_types, regex("\\.[^\\.]+$", each.value), "binary/octet-stream")
}

resource "aws_s3_bucket_object" "ui_file_short_cache" {
  for_each      = toset([
    for file in local.short_cache_fileset : file
  ])
  bucket        = aws_s3_bucket.ui.id
  key           = each.value
  source        = "${var.site_path}/${each.value}"
  etag          = filemd5("${var.site_path}/${each.value}")
  cache_control = "public, max-age=86400, must-revalidate"
  content_type  = lookup(local.mime_types, regex("\\.[^\\.]+$", each.value), "binary/octet-stream")
}

resource "aws_s3_bucket_object" "ui_file_static" {
  for_each = toset([
    for file in fileset(var.site_path, "**") : file if !contains(local.no_cache_fileset, file)
            && !contains(local.short_cache_fileset, file)
            && var.production ? length(regexall("\\.map$", file)) == 0 : true
  ])
  depends_on     = [aws_s3_bucket_object.ui_file_nocache, aws_s3_bucket_object.ui_file_short_cache]
  bucket        = aws_s3_bucket.ui.id
  key           = each.value
  source        = "${var.site_path}/${each.value}"
  etag          = filemd5("${var.site_path}/${each.value}")
  cache_control = "public, max-age=31536000"
  content_type  = lookup(local.mime_types, regex("\\.[^\\.]+$", each.value), "binary/octet-stream")
}
