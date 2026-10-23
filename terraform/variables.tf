variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "key_name" {
  type    = string
  default = "vehicle-rental-key"
}

variable "public_key_path" {
  type    = string
  default = "~/.ssh/vehicle-rental-key.pub"
}

variable "private_key_path" {
  type    = string
  default = "~/.ssh/vehicle-rental-key"
}

variable "allowed_ssh_cidr" {
  description = "Your public IP in CIDR form, e.g. 203.0.113.5/32 (used for SSH, Grafana, Prometheus)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "app_instance_type" {
  type    = string
  default = "t3.small"
}

variable "jenkins_instance_type" {
  type    = string
  default = "t3.medium"
}
