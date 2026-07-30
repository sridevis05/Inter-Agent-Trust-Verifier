provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

# 1. VPC Configuration
resource "aws_vpc" "sentinel_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "sentineltrust-vpc"
  }
}

# 2. EKS Cluster
resource "aws_eks_cluster" "eks" {
  name     = "sentineltrust-eks"
  role_arn = aws_iam_role.eks_role.arn

  vpc_config {
    subnet_ids = [aws_subnet.sub_a.id, aws_subnet.sub_b.id]
  }
}

# 3. RDS PostgreSQL Instance
resource "aws_db_instance" "postgres" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.t3.micro"
  db_name              = "sentineltrust"
  username             = "postgres"
  password             = "sentinelpassword"
  parameter_group_name = "default.postgres15"
  skip_final_snapshot  = true
  vpc_security_group_ids = [aws_security_group.db_sg.id]
}

# 4. Elasticache Redis Cluster
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "sentineltrust-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  security_group_ids   = [aws_security_group.redis_sg.id]
}

# IAM Roles placeholder (required for EKS)
resource "aws_iam_role" "eks_role" {
  name = "sentineltrust-eks-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })
}

# Mock Subnets and Security Groups
resource "aws_subnet" "sub_a" {
  vpc_id            = aws_vpc.sentinel_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
}

resource "aws_subnet" "sub_b" {
  vpc_id            = aws_vpc.sentinel_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
}

resource "aws_security_group" "db_sg" {
  name   = "sentineltrust-db-sg"
  vpc_id = aws_vpc.sentinel_vpc.id
}

resource "aws_security_group" "redis_sg" {
  name   = "sentineltrust-redis-sg"
  vpc_id = aws_vpc.sentinel_vpc.id
}
