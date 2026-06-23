variable "aws_region" {
  description = "AWS region where EKS and ECR will be created"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name used for AWS resources"
  type        = string
  default     = "taskops"
}

variable "cluster_version" {
  description = "EKS Kubernetes version"
  type        = string
  default     = "1.35"
}

variable "node_instance_types" {
  description = "Instance types for EKS worker nodes"
  type        = list(string)
  default     = ["t3.small"]
}

variable "node_min_size" {
  description = "Minimum number of EKS worker nodes"
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum number of EKS worker nodes"
  type        = number
  default     = 3
}

variable "node_desired_size" {
  description = "Desired number of EKS worker nodes"
  type        = number
  default     = 2
}

variable "node_subnet_type" {
  description = "Use private for normal EKS nodes. Use public only if you want direct SSH into worker nodes."
  type        = string
  default     = "private"

  validation {
    condition     = contains(["private", "public"], var.node_subnet_type)
    error_message = "node_subnet_type must be either private or public."
  }
}