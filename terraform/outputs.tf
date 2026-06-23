output "ssh_command" {
  description = "SSH command to connect to the EC2 instance"
  value       = "ssh -i your-key.pem ec2-user@${aws_instance.app_server.public_ip}"
}

output "frontend_url" {
  description = "Frontend URL after Docker Compose deployment"
  value       = "http://${aws_instance.app_server.public_ip}:8080"
}

output "prometheus_url" {
  description = "Prometheus URL if deployed on EC2"
  value       = "http://${aws_instance.app_server.public_ip}:9090"
}

output "grafana_url" {
  description = "Grafana URL if deployed on EC2"
  value       = "http://${aws_instance.app_server.public_ip}:3001"
}