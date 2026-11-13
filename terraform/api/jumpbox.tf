resource "aws_security_group" "jumpbox" {
  name        = format("%s-JumpBoxSecurityGroup", replace(var.host_name, "/[.]/", "-"))
  description = "Controls access to the Jumpbox for debugging reasons"
  vpc_id      = aws_vpc.api.id
  ingress {
    description      = "NFS for EFS access"
    from_port        = 2049
    protocol         = "tcp"
    to_port          = 2049
    cidr_blocks      = [aws_subnet.api_private[1].cidr_block]
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

resource "aws_iam_instance_profile" "jumpbox_profile" {
  name = format("JumpBoxProfile-%s", replace(var.host_name, "/[.]/", "-"))
  role = "AmazonSSMRoleForInstances"
}

data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

resource "aws_instance" "snap2snomed-jumpbox" {
  ami                    = coalesce(var.jumpbox_ami_id, nonsensitive(data.aws_ssm_parameter.al2023_ami.value))
  instance_type          = "t2.micro"
  iam_instance_profile   = aws_iam_instance_profile.jumpbox_profile.id
  subnet_id              = aws_subnet.api_private[1].id
  vpc_security_group_ids = [aws_security_group.jumpbox.id]
  user_data              = <<-EOF
              #!/bin/bash
              dnf install -y mariadb105
            EOF

  # CSIRO IM&T patching enrolment. IM&T first added these tags outside
  # Terraform; keeping them here means a replaced jumpbox stays enrolled.
  tags = {
    imt_patching = "imt_managed"
    imt_schedule = ""
  }

  # A new AL2023 release must not replace the jumpbox on every pipeline run.
  # Move to a newer AMI on purpose with: terraform apply -replace=<this address>
  lifecycle {
    ignore_changes = [ami, user_data]
  }
}
