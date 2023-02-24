locals {
  api_ecs_environment = [
    {
      name = "logging.level.org.hibernate.SQL"
      value = "DEBUG"
    },
    {
      name = "spring.datasource.url"
      value = "jdbc:mysql:aws://${aws_rds_cluster_instance.api.endpoint}:${aws_rds_cluster_instance.api.port}/${aws_rds_cluster.api.database_name}?cachePrepStmts=true&useServerPrepStmts=false&rewriteBatchedStatements=true&socketTimeout=480000"
    },
    {
      name  = "spring.datasource.driverClassName",
      value = "software.aws.rds.jdbc.mysql.Driver"
    },
    {
      name  = "spring.jpa.database-platform",
      value = "org.hibernate.dialect.MariaDBDialect"
    },
    {
      name  = "spring.datasource.username",
      value = aws_rds_cluster.api.master_username
    },
    {
      name  = "spring.datasource.password",
      value = var.database_password
    },
    {
      name  = "snap2snomed.security.clientId",
      value = var.client_id
    },
    {
      name  = "spring.security.oauth2.resourceserver.jwt.issuer-uri",
      value = "https://${var.jwt_issuer-uri}"
    },
    {
      name  = "snap2snomed.swagger.applicationVersion",
      value = var.application_version
    },
    {
      name  = "sentry.dsn",
      value = var.sentry_dsn
    },
    {
      name  = "sentry.environment",
      value = var.sentry_environment
    },
    {
      name  = "sentry.dialog",
      value = var.sentry_dialog
    },
    {
      name  = "snap2snomed.security.authDomainUrl",
      value = var.auth_domain_url
    },
    {
      name  = "snap2snomed.defaultTerminologyServer.url",
      value = var.fhir_url
    },
    {
      name  = "snap2snomed.applicationInstanceName",
      value = var.app_name
    },
    {
      name  = "snap2snomed.production",
      value = var.production
    }, 
    {
      name  = "snap2snomed.cors.allowedOriginPatterns",
      value = var.cors_allowed_origin_patterns
    },
    {
      name  = "snap2snomed.cors.allowedHeaders",
      value = var.cors_allowed_headers
    },
    {
      name  = "snap2snomed.cors.allowedMethods",
      value = var.cors_allowed_methods
    },
    {
      name  = "snap2snomed.cors.maxAge",
      value = var.cors_maxage
    },
    {
      name = "snap2snomed.maximumImportedCodeSetRows",
      value = "200000"
    },
    {
      name = "snap2snomed.userRegistrationUrl",
      value = var.user_registration_url
    },
    {
      name = "snap2snomed.registrationText",
      value = var.registration_text
    },
    {
      name = "snap2snomed.mainPageText",
      value = var.main_page_text
    },
    {
      name = "snap2snomed.identityProvider",
      value = var.identity_provider
    }
  ]
  dex_ecs_environment = [
        {
          name  = "DEX_ISSUER"
          value = format("https://%s/idp/dex", terraform.workspace == "prod" ? var.host_name_si : var.host_name)
        },
        {
          name  = "DEX_REDIRECT_URIS"
          value = jsonencode([format("%s/oauth2/idpresponse", var.auth_domain_url)])
        },
        {
          name  = "DEX_CLIENT_SECRET"
          value = var.dex_client_secret
        },
        {
          name  = "DEX_CROWD_URL"
          value = var.dex_crowd_url
        },
        {
          name  = "DEX_CROWD_CLIENT_ID"
          value = var.dex_crowd_client_id
        },
        {
          name  = "DEX_CROWD_CLIENT_SECRET"
          value = var.dex_crowd_client_secret
        },
        {
          name  = "DEX_DB_NAME"
          value = "dex_db"
        },
        {
          name  = "DEX_DB_USER"
          value = var.database_user
        },
        {
          name  = "DEX_DB_PASSWD"
          value = var.database_password
        },
        {
          name  = "DEX_DB_HOST"
          value = "${aws_rds_cluster_instance.api.endpoint}"
        },
        {
          name  = "DEX_DB_PORT"
          value = jsonencode(aws_rds_cluster_instance.api.port)
        },
        {
          name  = "DEX_DB_CREATE"
          value = "true"
        },
        {
          name  = "DEX_LOG_LEVEL"
          value = var.dex_loglevel
        }
  ]
}
