# TaskOps DevOps Capstone

TaskOps is a full DevOps capstone project that demonstrates how a simple full-stack application can be containerized, provisioned on AWS, deployed to Kubernetes using GitOps, and monitored using Prometheus and Grafana.

The goal of this project is not only to run an application, but to show a complete beginner-friendly DevOps workflow:

```text
Code Push → GitHub Actions → Amazon ECR → Terraform AWS Infrastructure → EKS → Argo CD → Helm → Kubernetes → Prometheus/Grafana
```

---

## Architecture

```text
Developer
   |
   | git push
   v
GitHub Repository
   |
   | GitHub Actions
   v
Docker Build
   |
   | Push images
   v
Amazon ECR
   |
   | Images pulled by Kubernetes
   v
Amazon EKS Cluster
   |
   | Argo CD syncs Helm chart
   v
TaskOps Application
   |
   | /metrics endpoint
   v
Prometheus
   |
   | Data source
   v
Grafana Dashboard
```

---

## Tech Stack

| Category | Tools |
|---|---|
| Cloud Provider | AWS |
| Infrastructure as Code | Terraform |
| Container Registry | Amazon ECR |
| Containerization | Docker |
| Orchestration | Kubernetes, Amazon EKS |
| Package/Deployment | Helm |
| GitOps | Argo CD |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus |
| Visualization | Grafana |
| Application | Node.js, HTML, CSS, JavaScript |
| Database | MySQL |

---

## Repository Structure

```text
.
├── .github/
│   └── workflows/
│       └── docker-build.yml
├── app/
│   ├── backend/
│   └── frontend/
├── argocd/
│   └── application.yaml
├── helm/
│   └── taskops-chart/
├── monitoring/
│   └── prometheus.yaml
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── terraform.tfvars
├── docker-compose.yml
└── README.md
```

---

## Features

- Automated Docker image build using GitHub Actions
- Docker images pushed to Amazon ECR
- AWS infrastructure provisioned using Terraform
- EKS cluster deployment
- Kubernetes manifests managed through Helm
- GitOps deployment using Argo CD
- Frontend exposed through a Kubernetes LoadBalancer service
- Backend service monitored through Prometheus
- Grafana dashboard for visual monitoring
- MySQL database deployed inside Kubernetes

---

## Infrastructure Provisioning

Terraform is used to create the AWS infrastructure required for the project.

The Terraform setup creates:

- Amazon ECR repository for the backend image
- Amazon ECR repository for the frontend image
- AWS VPC
- Public and private subnets
- NAT Gateway
- Amazon EKS cluster
- EKS managed node group

### Terraform Commands

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

After Terraform completes, get the outputs:

```bash
terraform output
```

Important outputs:

```text
aws_account_id
aws_region
cluster_name
cluster_endpoint
backend_ecr_repository_url
frontend_ecr_repository_url
```

---

## Connecting kubectl to EKS

After the EKS cluster is created, connect your local `kubectl` to the cluster:

```bash
aws eks update-kubeconfig --region ap-south-1 --name taskops-eks
```

Verify the connection:

```bash
kubectl get nodes
```

Expected result:

```text
NAME                                      STATUS   ROLES    AGE   VERSION
ip-xx-xx-xx-xx.ap-south-1.compute.internal   Ready    <none>   ...
```

---

## CI/CD with GitHub Actions

GitHub Actions builds and pushes Docker images to Amazon ECR.

The workflow is triggered when code is pushed to the `main` branch and changes are made inside the `app/` directory.

The workflow builds:

- Backend Docker image
- Frontend Docker image

Each image is pushed to ECR using two tags:

```text
latest
github commit SHA
```

Example image format:

```text
AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/taskops-backend:latest
AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/taskops-frontend:latest
```

Required GitHub repository secrets:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

---

## Helm Deployment

The TaskOps application is deployed using a Helm chart located in:

```text
helm/taskops-chart
```

The Helm chart manages:

- Frontend deployment
- Frontend service
- Backend deployment
- Backend service
- MySQL deployment
- MySQL service
- Persistent storage configuration

Before deploying, update the image repositories in:

```text
helm/taskops-chart/values.yaml
```

Example:

```yaml
frontend:
  image:
    repository: 123456789012.dkr.ecr.ap-south-1.amazonaws.com/taskops-frontend
    tag: latest
    pullPolicy: Always

backend:
  image:
    repository: 123456789012.dkr.ecr.ap-south-1.amazonaws.com/taskops-backend
    tag: latest
    pullPolicy: Always
```

---

## GitOps with Argo CD

Argo CD is used to continuously sync the Kubernetes application from GitHub into the EKS cluster.

The Argo CD application manifest is located at:

```text
argocd/application.yaml
```

It points to the Helm chart path:

```text
helm/taskops-chart
```

### Install Argo CD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Check Argo CD pods:

```bash
kubectl get pods -n argocd
```

### Apply the Argo CD Application

```bash
kubectl apply -f argocd/application.yaml
```

Check the application:

```bash
kubectl get applications -n argocd
```

Expected result:

```text
NAME      SYNC STATUS   HEALTH STATUS
taskops   Synced        Healthy
```

---

## Accessing Argo CD UI

Port-forward the Argo CD server:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Open:

```text
https://localhost:8080
```

Username:

```text
admin
```

Get the password in Git Bash or WSL:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

PowerShell:

```powershell
$password = kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}"
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($password))
```

---

## Application Deployment Verification

Check TaskOps pods:

```bash
kubectl get pods -n taskops
```

Check services:

```bash
kubectl get svc -n taskops
```

The frontend service should expose a LoadBalancer DNS:

```text
frontend   LoadBalancer   xxxx.elb.ap-south-1.amazonaws.com
```

Open the LoadBalancer URL in the browser:

```text
http://LOAD_BALANCER_DNS
```

---

## Monitoring with Prometheus and Grafana

The monitoring configuration is located at:

```text
monitoring/prometheus.yaml
```

Prometheus is configured to scrape the backend metrics endpoint:

```text
backend.taskops.svc.cluster.local:5000/metrics
```

### Install Prometheus and Grafana

Add the Helm repository:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

Install or upgrade the monitoring stack:

```bash
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --create-namespace \
  -f monitoring/prometheus.yaml
```

Check monitoring pods:

```bash
kubectl get pods -n monitoring
```

---

## Accessing Grafana

If Grafana is exposed using LoadBalancer:

```bash
kubectl get svc -n monitoring
```

Open the external LoadBalancer URL for:

```text
monitoring-grafana
```

If using port-forward:

```bash
kubectl port-forward svc/monitoring-grafana -n monitoring 3000:80
```

Open:

```text
http://localhost:3000
```

Grafana login:

```text
Username: admin
Password: TaskOpsAdmin123
```

---

## Grafana Dashboard Panel

A simple Grafana panel was created to monitor whether the backend is reachable by Prometheus.

### Panel: TaskOps Backend Status

PromQL query:

```promql
up{job="taskops-backend"}
```

Panel settings:

```text
Visualization: Stat
Title: TaskOps Backend Status
Unit: none
```

Value mapping:

```text
1 = UP
0 = DOWN
```

This panel confirms that Prometheus is successfully scraping the TaskOps backend metrics endpoint.

---


### Amazon ECR Repositories

![Amazon ECR Repositories](assets/screenshots/ecr-repositories.png)

### GitHub Actions Successful Workflow

![GitHub Actions Success](assets/screenshots/github-actions-success.png)

### EKS Nodes Running

![EKS Nodes Running](assets/screenshots/eks-nodes-running.png)

### Argo CD Application Healthy

![Argo CD Healthy](assets/screenshots/argocd-application-healthy.png)

### TaskOps Pods Running

![TaskOps Pods Running](assets/screenshots/taskops-pods-running.png)

### Frontend LoadBalancer Service

![Frontend LoadBalancer](assets/screenshots/taskops-loadbalancer-service.png)

### TaskOps Frontend in Browser

![TaskOps Frontend](assets/screenshots/taskops-frontend-browser.png)

### Monitoring Pods Running

![Monitoring Pods](assets/screenshots/monitoring-pods-running.png)

### Grafana Backend Status Panel

![Grafana Backend Status Panel](assets/screenshots/grafana-backend-status-panel.png)

### Prometheus Targets

![Prometheus Targets](assets/screenshots/prometheus-targets.png)


---

## Current Limitation

The project currently uses the `latest` image tag in the Helm values file.

This works for basic deployment, but for a stronger GitOps workflow, GitHub Actions should update the Helm image tag to the Git commit SHA after pushing the image.

---

## Project Summary

TaskOps demonstrates a complete DevOps deployment pipeline using modern cloud-native tools. The project provisions AWS infrastructure with Terraform, builds and pushes Docker images using GitHub Actions, deploys the application to Amazon EKS through Argo CD and Helm, and monitors the application using Prometheus and Grafana.