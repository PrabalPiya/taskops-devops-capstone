variable "aws_region" {
  description = "AWS region where infrastructure will be created"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "taskops"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ssh_key" {
  description = "Path to your local SSH public key"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH into the EC2 instance"
  type        = string
  default     = "0.0.0.0/0"
}