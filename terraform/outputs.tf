output "app_public_ip" {
  value = aws_instance.app.public_ip
}

output "jenkins_public_ip" {
  value = aws_instance.jenkins.public_ip
}

output "app_url" {
  value = "http://${aws_instance.app.public_ip}"
}

output "grafana_url" {
  value = "http://${aws_instance.app.public_ip}:3000"
}

output "prometheus_url" {
  value = "http://${aws_instance.app.public_ip}:9090"
}

output "jenkins_url" {
  value = "http://${aws_instance.jenkins.public_ip}:8080"
}
