# Vehicle Rental System — DevOps Project

React + Node.js/Express + MongoDB, containerised with Docker, provisioned with Terraform on AWS,
configured with Ansible, delivered by a Jenkins pipeline, monitored with Prometheus + Grafana.

```
Developer → GitHub → Jenkins (test → build → push to Docker Hub → ansible deploy)
                                   │
Terraform → 2 × EC2 (app server, Jenkins server) ← Ansible (Docker, Jenkins)
App server runs: frontend(nginx) · backend · mongo · prometheus · grafana · node-exporter
```

Run every command below inside **WSL (Ubuntu)**, and keep the project inside the Linux
filesystem (e.g. `~/vehicle-rental`), NOT under `/mnt/c`, otherwise SSH key permissions break.

## 0. One-time tools 
```bash
sudo apt update && sudo apt install -y git curl unzip ansible nodejs npm
# Terraform
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install -y terraform
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip && unzip awscliv2.zip && sudo ./aws/install
# Docker: install Docker Desktop on Windows and enable WSL integration for your Ubuntu distro
```
You also need: an AWS account, an IAM user with access keys, a Docker Hub account, a GitHub account.

## 1. Run locally
```bash
docker compose up --build
```
App http://localhost · Prometheus http://localhost:9090 · Grafana http://localhost:3000 (admin/admin)
Backend metrics: http://localhost/api/health (health) — raw metrics are scraped internally at backend:5000/metrics.

Dev mode without Docker: `cd backend && npm i && MONGO_URI=... npm start` and `cd frontend && npm i && npm run dev`.

## 2. Push the code to GitHub
```bash
git init && git add . && git commit -m "Vehicle rental devops project"
git branch -M main
git remote add origin https://github.com/<you>/vehicle-rental.git
git push -u origin main
```

## 3. Terraform: create AWS infrastructure
```bash
aws configure                                   # access key, secret, region
ssh-keygen -t ed25519 -f ~/.ssh/vehicle-rental-key -N ""
cd terraform
terraform init
terraform plan  -var="allowed_ssh_cidr=$(curl -s ifconfig.me)/32"
terraform apply -var="allowed_ssh_cidr=$(curl -s ifconfig.me)/32"
```
This creates 2 EC2 instances + security group + key pair, and writes `ansible/inventory.ini`.
Outputs show all URLs. Note: if your IP changes, re-apply with the new IP.

## 4. Ansible: configure servers
```bash
cd ../ansible
ansible all -m ping                 # connectivity check
ansible-playbook setup.yml          # Docker everywhere + Jenkins (prints the admin password)
```

## 5. Jenkins setup (browser: http://<jenkins_ip>:8080)
1. Paste the initial admin password → Install suggested plugins → create admin user.
2. Manage Jenkins → Credentials → Global → add:
   - `dockerhub-creds` — Username with password (Docker Hub username + access token)
   - `app-server-ip` — Secret text (the app_public_ip from Terraform)
   - `app-ssh-key` — Secret file (upload ~/.ssh/vehicle-rental-key)
3. New Item → Pipeline → "Pipeline script from SCM" → Git → your repo URL, branch `main`, script path `Jenkinsfile`.
   (Private repo: add GitHub credentials.)
4. Build Now.

## 6. Verify
- App: `http://<app_ip>`
- Prometheus targets: `http://<app_ip>:9090/targets` (all UP)
- Grafana: `http://<app_ip>:3000` → Dashboards → "Vehicle Rental Overview"
- Generate traffic: `for i in $(seq 1 200); do curl -s http://<app_ip>/api/vehicles >/dev/null; done`

## 7. Manual deploy (without Jenkins)
```bash
export DOCKERHUB_USER=<you>
docker login
docker compose build && docker compose push backend frontend
cd ansible && ansible-playbook deploy.yml -e image_tag=latest
```

## 8. Clean up (AWS costs money while running!)
```bash
cd terraform && terraform destroy
```

## Security notes
- `allowed_ssh_cidr` limits SSH/Grafana/Prometheus to your IP. Jenkins (8080) is open so you can reach it; restrict it too for real use.
- Change Grafana's password: `ansible-playbook deploy.yml -e grafana_password=<strong>`.
- MongoDB is not published outside the Docker network and has no auth — fine for a demo; add auth for production.
