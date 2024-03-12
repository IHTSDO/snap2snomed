resource "aws_rds_cluster" "api" {
  cluster_identifier              = replace(var.host_name, "/[.]/", "-")
  engine                          = "aurora-mysql"
  engine_version                  = "8.0.mysql_aurora.3.04.1"
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.snapdbcluster.id
  backup_retention_period         = var.database_backup_retention_period
  database_name                   = replace(var.host_name, "/[.]/", "")
  master_username                 = var.database_user
  master_password                 = var.database_password
  db_subnet_group_name            = aws_db_subnet_group.api.name
  vpc_security_group_ids          = [aws_security_group.api_db.id,aws_security_group.jumpbox_db.id]
  final_snapshot_identifier       = "ci-aurora-cluster-backup-final"
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_rds_cluster_instance" "api" {
  cluster_identifier      = aws_rds_cluster.api.id
  engine                  = "aurora-mysql"
  instance_class          = "db.t3.medium"
  lifecycle {
    ignore_changes = [engine_version]
  }
}

resource "aws_db_subnet_group" "api" {
  description = format("%s SNAP-2-SNOMED", replace(var.host_name, "/[.]/", "-")) 
  subnet_ids = [
    aws_subnet.api_private[0].id,
    aws_subnet.api_private[1].id
  ]
}

resource "aws_security_group" "api_db" {
  name        = format("%s-DatabaseSecurityGroup", replace(var.host_name, "/[.]/", "-")) 
  description = "Controls access to the database for the SNAP-2-SNOMED API."
  vpc_id      = aws_vpc.api.id
  ingress {
    description     = "MySQL connections from the API"
    from_port       = 3306
    protocol        = "tcp"
    to_port         = 3306
    security_groups = [aws_security_group.api.id,aws_security_group.dex.id]
  }
}

resource "aws_security_group" "jumpbox_db" {
  name        = format("%s-Snap2SnomedDatabaseDebug", replace(var.host_name, "/[.]/", "-")) 
  description = "Controls access to the database for the Jumpbox."
  vpc_id      = aws_vpc.api.id
  ingress {
    description     = "MySQL connections from the Jumpbox"
    from_port       = 3306
    protocol        = "tcp"
    to_port         = 3306
    security_groups = [aws_security_group.jumpbox.id]
  }
}

resource "aws_rds_cluster_parameter_group" "snapdbcluster" {
  name        = format("%s-snapdb-aurora-mysql8-0", replace(var.host_name, "/[.]/", "-"))
  description = "align with 5-7 version"
  family      = "aurora-mysql8.0"
  parameter {
    name = "character_set_server"
    value = "utf8"
  }
  parameter {
    name = "character_set_client"
    value = "utf8"
  }
  parameter {
    name = "character_set_connection"
    value = "utf8"
  }
  parameter {
    name = "collation_server"
    value = "utf8_unicode_ci"
  }
  parameter {
    name = "collation_connection"
    value = "utf8_unicode_ci"
  }
}
