resource "aws_security_group" "jumpbox" {
  name        = format("%s-JumpBoxSecurityGroup", replace(var.host_name, "/[.]/", "-"))
  description = "Controls access to the Jumpbox for debugging reasons"
  vpc_id      = aws_vpc.api.id
  ingress {
    description     = "NFS for EFS access"
    from_port       = 2049
    protocol        = "tcp"
    to_port         = 2049
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

resource "aws_instance" "snap2snomed-jumpbox" {
  ami = var.jumpbox_ami_id
  instance_type = "t2.micro"
  iam_instance_profile = aws_iam_instance_profile.jumpbox_profile.id
  subnet_id = aws_subnet.api_private[1].id
  vpc_security_group_ids=[aws_security_group.jumpbox.id]
  user_data = <<-EOF
              #!/bin/bash
              yum install -y mariadb
            EOF
}
