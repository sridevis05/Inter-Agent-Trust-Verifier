variable "aws_region" {
  description = "AWS deployment region"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "EKS cluster identifier"
  type        = string
  default     = "sentineltrust-eks"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}
