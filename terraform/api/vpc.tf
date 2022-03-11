resource "aws_vpc" "api" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
}

resource "aws_subnet" "api_public" {
  count                   = 2
  vpc_id                  = aws_vpc.api.id
  cidr_block              = "10.0.${0 + count.index}.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "${var.aws_region}${format("%x", count.index + 10)}"
}

resource "aws_subnet" "api_private" {
  count             = 2
  vpc_id            = aws_vpc.api.id
  cidr_block        = "10.0.${2 + count.index}.0/24"
  availability_zone = "${var.aws_region}${format("%x", count.index + 10)}"
}

resource "aws_internet_gateway" "api" {
  vpc_id = aws_vpc.api.id
}

resource "aws_nat_gateway" "api" {
  count         = 2
  allocation_id = aws_eip.api_nat[count.index].id
  subnet_id     = aws_subnet.api_public[count.index].id
}

resource "aws_eip" "api_nat" {
  count = 2
}

resource "aws_route_table" "api_public" {
  count  = 2
  vpc_id = aws_vpc.api.id
}

resource "aws_route" "api_public" {
  count                  = 2
  route_table_id         = aws_route_table.api_public[count.index].id
  gateway_id             = aws_internet_gateway.api.id
  destination_cidr_block = "0.0.0.0/0"
}

resource "aws_route_table_association" "api_public" {
  count          = 2
  subnet_id      = aws_subnet.api_public[count.index].id
  route_table_id = aws_route_table.api_public[count.index].id
}

resource "aws_route_table" "api_private" {
  count  = 2
  vpc_id = aws_vpc.api.id
}

resource "aws_route" "api_private" {
  count                  = 2
  route_table_id         = aws_route_table.api_private[count.index].id
  nat_gateway_id         = aws_nat_gateway.api[count.index].id
  destination_cidr_block = "0.0.0.0/0"
}

resource "aws_route_table_association" "api_private" {
  count          = 2
  subnet_id      = aws_subnet.api_private[count.index].id
  route_table_id = aws_route_table.api_private[count.index].id
}
