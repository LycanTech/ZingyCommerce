# ZingyCommerce — Production-Ready Ecommerce Microservices on Azure

A beginner-friendly, fully production-ready ecommerce platform built with microservices, Docker, Kubernetes (AKS), Helm, ArgoCD (GitOps), Prometheus + Grafana monitoring, and Terraform IaC — all on Azure.

---

## Table of Contents

1. [What Are We Building?](#1-what-are-we-building)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Key Concepts Explained](#4-key-concepts-explained)
5. [Prerequisites](#5-prerequisites)
6. [Project Structure](#6-project-structure)
7. [Part A: Run Locally with Docker Compose](#7-part-a-run-locally)
8. [Part B: Provision Azure Infrastructure (Terraform)](#8-part-b-terraform)
9. [Part C: Deploy to AKS with Helm + ArgoCD](#9-part-c-helm-argocd)
10. [Part D: Set Up the CI/CD Pipeline](#10-part-d-cicd)
11. [Part E: Monitoring — Prometheus + Grafana + Loki](#11-part-e-monitoring)
12. [Testing the Application](#12-testing)
13. [Cost Estimate](#13-cost-estimate)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. What Are We Building?

An online shop where customers can browse products, register, log in, and place orders. The shop is split into **microservices** — small independent programs that each do one job. This is how large companies like Netflix, Amazon, and Uber build their systems.

What makes this production-ready:

| Feature | Tool Used |
|---------|-----------|
| Container packaging | Docker |
| Container orchestration | Kubernetes (AKS) |
| Kubernetes package manager | Helm |
| GitOps CD (auto-deploy on Git push) | ArgoCD |
| Infrastructure as Code | Terraform |
| CI/CD pipeline | Azure DevOps + GitHub Actions |
| Metrics & dashboards | Prometheus + Grafana |
| Log aggregation | Loki + Promtail |
| HTTPS / TLS | cert-manager + Let's Encrypt |
| Ingress routing | NGINX Ingress Controller |
| Private Docker registry | Azure Container Registry |

---

## 2. Architecture Overview

```
                         INTERNET (HTTPS)
                               │
                    ┌──────────▼──────────┐
                    │  Azure Load Balancer │
                    │  (1 public IP)       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  NGINX Ingress       │
                    │  Controller          │
                    └──────┬──────┬───────┘
                           │      │
              /api/*        │      │  /*
          ┌────────────────▼─┐  ┌─▼────────────────┐
          │   API Gateway    │  │     Frontend       │
          │   (port 3000)    │  │  (nginx, port 80)  │
          └──┬────┬────┬─────┘  └───────────────────┘
             │    │    │
    ┌────────▼┐ ┌─▼────▼──┐ ┌─────────┐
    │  User   │ │ Product  │ │  Order  │
    │ Service │ │ Service  │ │ Service │
    │ :3001   │ │  :3002   │ │  :3003  │
    └────┬────┘ └────┬─────┘ └────┬────┘
         │           │            │
      users.db   products.db   orders.db
      (SQLite)    (SQLite)      (SQLite)

          ┌──────────────────────────────┐
          │         Monitoring           │
          │  Prometheus (metrics scrape) │
          │  Grafana    (dashboards)     │
          │  Loki       (log search)     │
          └──────────────────────────────┘

          ┌──────────────────────────────┐
          │         GitOps               │
          │  Git push → CI builds image  │
          │  → updates values.yaml in Git│
          │  → ArgoCD detects → syncs AKS│
          └──────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Services | Node.js + Express | Business logic |
| Database | SQLite (per service) | Data persistence |
| Auth | JWT + bcryptjs | Secure login |
| Frontend | HTML/CSS/JS on nginx | User interface |
| Containers | Docker (multi-stage) | Packaging |
| Local dev | Docker Compose | Run everything locally |
| K8s package mgr | Helm | Template + deploy K8s manifests |
| GitOps CD | ArgoCD | Auto-deploy on Git changes |
| K8s cluster | Azure Kubernetes Service | Managed Kubernetes |
| Container registry | Azure Container Registry | Private Docker images |
| IaC | Terraform | Provision all Azure resources |
| CI/CD | Azure DevOps + GitHub Actions | Build, test, deploy pipeline (dual repo) |
| Metrics | Prometheus | Collect service metrics |
| Dashboards | Grafana | Visualize metrics |
| Logs | Loki + Promtail | Collect and search pod logs |
| TLS certs | cert-manager + Let's Encrypt | Free automatic HTTPS |
| Ingress | NGINX Ingress Controller | Route traffic to pods |

---

## 4. Key Concepts Explained

### What is a Microservice?
Instead of one big program, your app is split into small services. Each:
- Does **one thing** (users, products, orders)
- Has its **own database** — services never share a database
- Can be **scaled independently** — if orders are busy, only scale Order Service
- Can be **updated without touching other services**

### What is Docker?
Packages your app into a **container** — like a shipping container with Node.js, your code, and all dependencies baked in. Runs identically everywhere.

### What is Kubernetes (AKS)?
Manages many containers across many servers. Automatically:
- Restarts containers that crash
- Scales up/down based on traffic
- Routes network traffic
- Rolls out updates without downtime

### What is Helm?
Kubernetes has many YAML files. Helm is a **package manager for Kubernetes** — like npm for Node.js but for K8s configs. It lets you:
- Templatize YAML (use variables instead of copy-pasting)
- Deploy all 5 services with one command
- Use different values for dev vs prod (fewer replicas, no TLS in dev)
- Roll back to a previous release with one command

### What is ArgoCD (GitOps)?
**GitOps** means Git is the single source of truth for what should be running in your cluster.

**Old way (imperative):**
1. CI builds image → CI runs `kubectl apply` → pods update

**GitOps way (declarative):**
1. CI builds image → CI updates `image.tag` in `values.yaml` → commits to Git
2. ArgoCD detects the Git change → runs `helm upgrade` → pods update

Why GitOps is better:
- Every deploy is a **Git commit** — full audit trail of who deployed what
- **Roll back** = `git revert` — one command
- Cluster state always **matches Git** — no "mystery deploys"
- CI pipeline doesn't need `kubectl` credentials

### What is Terraform?
Describes your Azure infrastructure as code (`.tf` files). Run `terraform apply` and it creates AKS, ACR, VNet, etc. You can destroy and recreate your entire cloud environment repeatably.

### What is Prometheus + Grafana?
- **Prometheus** scrapes metrics from your pods every 15 seconds (requests/sec, CPU, memory, error rates)
- **Grafana** displays those metrics as visual dashboards
- Your pods expose metrics at `/health` — Prometheus finds them via pod annotations (`prometheus.io/scrape: "true"`)

### What is cert-manager + NGINX Ingress?
- **NGINX Ingress** = one public IP routes to all services based on URL path (`/api/*` → gateway, `/*` → frontend)
- **cert-manager** = automatically gets free TLS certificates from Let's Encrypt so your site has HTTPS

---

## 5. Prerequisites

### On your laptop:
```bash
# Node.js v20+ — run the services locally
node --version

# Docker Desktop — build and run containers
docker --version

# Git
git --version

# Azure CLI
az --version

# kubectl — talk to your K8s cluster
kubectl version --client

# Helm — deploy the Helm chart
helm version

# Terraform — provision Azure infrastructure
terraform --version
```

Install links:
- Node.js: https://nodejs.org (choose LTS)
- Docker Desktop: https://www.docker.com/products/docker-desktop
- Azure CLI: `winget install Microsoft.AzureCLI`
- kubectl: `az aks install-cli`
- Helm: https://helm.sh/docs/intro/install/
- Terraform: https://developer.hashicorp.com/terraform/install

### Azure:
- Free account: https://azure.microsoft.com/free ($200 credit, 30 days)
- Azure DevOps: https://dev.azure.com (free for up to 5 users)

---

## 6. Project Structure

```
ZingyCommerce/
├── services/
│   ├── user-service/       # Node.js — register, login, JWT auth
│   ├── product-service/    # Node.js — product catalog, search, stock
│   ├── order-service/      # Node.js — place orders, check stock
│   └── api-gateway/        # Node.js — reverse proxy, JWT verification
├── frontend/               # HTML/CSS/JS — the website (served by nginx)
│
├── helm/
│   └── zingycommerce/      # Helm chart — K8s deployment package
│       ├── Chart.yaml          # Chart metadata
│       ├── values.yaml         # Default config values
│       ├── values-dev.yaml     # Dev overrides (1 replica, no TLS)
│       ├── values-prod.yaml    # Prod overrides (3 replicas, TLS on)
│       └── templates/
│           ├── _helpers.tpl        # Reusable template snippets
│           ├── namespace.yaml
│           ├── secrets.yaml        # (comment only — secret created manually)
│           ├── ingress.yaml        # NGINX Ingress routing rules
│           ├── hpa.yaml            # Horizontal Pod Autoscaler
│           ├── user-service/       # Deployment + Service
│           ├── product-service/    # Deployment + Service
│           ├── order-service/      # Deployment + Service
│           ├── api-gateway/        # Deployment + Service
│           └── frontend/           # Deployment + Service
│
├── argocd/
│   ├── install.yaml        # ArgoCD server patches + Ingress
│   ├── appproject.yaml     # RBAC scope (which repos/namespaces allowed)
│   └── application.yaml    # THE ArgoCD app — points to our Helm chart
│
├── monitoring/
│   ├── prometheus/
│   │   └── values.yaml     # kube-prometheus-stack Helm values
│   ├── grafana/
│   │   └── dashboards/
│   │       └── zingycommerce-dashboard.json  # Custom Grafana dashboard
│   └── loki/
│       └── values.yaml     # Loki log aggregation values
│
├── infrastructure/         # Terraform — Azure IaC
│   ├── main.tf             # Provider, resource group, backend
│   ├── variables.tf        # All input variables
│   ├── outputs.tf          # Values printed after apply
│   ├── acr.tf              # Azure Container Registry
│   ├── aks.tf              # Azure Kubernetes Service
│   ├── monitoring.tf       # Log Analytics Workspace
│   ├── helm.tf             # Documents why K8s tooling is in bootstrap, not Terraform
│   └── terraform.tfvars.example
│
├── k8s/                    # Raw Kubernetes manifests (reference / fallback)
├── .azure-pipelines/
│   ├── app-pipeline.yml    # Builds images + GitOps tag update (Azure DevOps)
│   ├── infra-pipeline.yml  # Terraform plan → approve → apply (Azure DevOps)
│   └── bootstrap-pipeline.yml  # One-time cluster setup, manual trigger (Azure DevOps)
├── .github/
│   └── workflows/
│       ├── app.yml         # Builds images + GitOps tag update (GitHub Actions)
│       ├── infra.yml       # Terraform plan → approve → apply (GitHub Actions)
│       └── bootstrap.yml   # One-time cluster setup, manual trigger (GitHub Actions)
├── docker-compose.yml      # Local development
├── generate-pdf.js         # Script to regenerate the PDF report
└── ZingyCommerce-Project-Report.pdf
```

---

## 7. Part A: Run Locally

No cloud account needed. Everything runs in Docker on your laptop.

```bash
# 1. Clone the repo
git clone https://github.com/LycanTech/ZingyCommerce.git
cd ZingyCommerce

# 2. Start all services
docker compose up --build

# That's it! Open in your browser:
#   Frontend:    http://localhost:8081
#   API Gateway: http://localhost:4000
```

To stop:
```bash
docker compose down

# To also delete the SQLite databases (fresh start):
docker compose down -v
```

---

## 8. Part B: Provision Azure Infrastructure (Terraform)

### Step 1: Set up Terraform state storage

Terraform needs to store its state file somewhere. We use Azure Blob Storage.
```bash
# Login to Azure
az login

# Resource group, storage account and container are already created:
#   Resource Group:    zcommerce-tfstate-rg
#   Storage Account:   zcommercetfstate
#   Container:         tfstate
#
# To recreate from scratch:
az group create --name zcommerce-tfstate-rg --location eastus
az storage account create \
  --name zcommercetfstate \
  --resource-group zcommerce-tfstate-rg \
  --location eastus \
  --sku Standard_LRS
az storage container create \
  --name tfstate \
  --account-name zcommercetfstate
```

### Step 2: Create your variables file

```bash
cp infrastructure/terraform.tfvars.example infrastructure/terraform.tfvars
# Edit the file and set your values:
#   prefix      = "zcommerce"
#   environment = "dev"
#   location    = "eastus"
```

### Step 3: Initialize and apply

```bash
cd infrastructure

# Downloads the Azure provider plugin and connects to the state backend
terraform init \
  -backend-config="storage_account_name=zcommercetfstate" \
  -backend-config="resource_group_name=zcommerce-tfstate-rg" \
  -backend-config="container_name=tfstate" \
  -backend-config="key=zcommerce.terraform.tfstate"

# Preview what will be created (no changes made)
terraform plan -var="prefix=zcommerce" -var="environment=dev"

# Create everything (takes ~10 minutes for AKS)
terraform apply -var="prefix=zcommerce" -var="environment=dev"
```

Terraform creates:

| Resource                  | Name                                               |
|---------------------------|----------------------------------------------------|
| Resource Group            | `zcommerce-ecommerce-dev-rg`                       |
| Container Registry (ACR)  | `zcommerceecommerceacrdev`                         |
| Kubernetes Cluster (AKS)  | `zcommerce-aks-dev` (Managed OS disk, Standard_B2s)|
| Log Analytics Workspace   | `zcommerce-logs-dev`                               |

> **Note:** NGINX Ingress, cert-manager, Prometheus, Loki, and ArgoCD are **not** managed by Terraform. They are installed by the bootstrap pipeline after `terraform apply` completes (see Part D).

---

## 9. Part C: Deploy to AKS with Helm + ArgoCD

### Step 1: Connect kubectl to your cluster

```bash
# Get credentials from the Terraform output
az aks get-credentials \
  --resource-group zcommerce-ecommerce-dev-rg \
  --name zcommerce-aks-dev

# Verify
kubectl get nodes
```

### Step 2: Create the JWT secret

The JWT secret must exist in the cluster before any service starts. Create it once:

```bash
kubectl create secret generic zingycommerce-secrets \
  --namespace zcommerce \
  --from-literal=jwt-secret="$(openssl rand -hex 32)"

# Verify it was created
kubectl get secret zingycommerce-secrets -n zcommerce
```

### Step 3: Build and push your images

```bash
# Login to ACR
ACR_NAME=$(terraform -chdir=infrastructure output -raw acr_login_server)
az acr login --name $ACR_NAME

# Build and push all 5 images
for svc in user-service product-service order-service api-gateway; do
  docker build -t ${ACR_NAME}/${svc}:latest services/${svc}/
  docker push ${ACR_NAME}/${svc}:latest
done

docker build -t ${ACR_NAME}/frontend:latest frontend/
docker push ${ACR_NAME}/frontend:latest
```

### Step 4: Deploy via Helm (first time)

```bash
# Update the ACR login server in values.yaml
# Edit helm/zingycommerce/values.yaml:
#   global.acrLoginServer: "zcommerceecommerceacrdev.azurecr.io"

# Deploy dev environment
helm upgrade --install zingycommerce ./helm/zingycommerce \
  -f helm/zingycommerce/values.yaml \
  -f helm/zingycommerce/values-dev.yaml \
  --namespace zcommerce \
  --create-namespace

# Check the status
helm status zingycommerce -n zcommerce
kubectl get pods -n zcommerce
```

### Step 5: Set up ArgoCD

```bash
# Get the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Register the Application
kubectl apply -f argocd/appproject.yaml
kubectl apply -f argocd/application.yaml

# Now ArgoCD manages the deployment. Every time you push code:
# 1. CI builds a new Docker image
# 2. CI updates image.tag in values.yaml and commits to Git
# 3. ArgoCD detects the commit (polls every 3 min)
# 4. ArgoCD runs: helm upgrade zingycommerce ... (rolling update)
```

### Step 6: Get the public IP and configure DNS

```bash
# Get the NGINX Ingress public IP
kubectl get svc -n ingress-nginx ingress-nginx-controller

# Add a DNS A record at your domain registrar:
#   zingycommerce.yourdomain.com  →  <EXTERNAL-IP>
#   argocd.yourdomain.com         →  <EXTERNAL-IP>
#   grafana.yourdomain.com        →  <EXTERNAL-IP>

# Once DNS propagates, visit:
#   https://zingycommerce.yourdomain.com   ← your shop
#   https://argocd.yourdomain.com          ← ArgoCD UI
#   https://grafana.yourdomain.com         ← metrics dashboards
```

---

## 10. Part D: Set Up the CI/CD Pipeline

### Pre-flight: 6 steps in order

> ⚠️ **Do these before running any pipeline.** Skipping any step will cause the first run to fail.

#### Step 1 — Push code to both remotes

```bash
git push -u github main
git push -u azure main
```

#### Step 2 — Create a Service Principal (both pipelines authenticate with this)

```bash
az ad sp create-for-rbac \
  --name "zcommerce-pipeline-sp" \
  --role Contributor \
  --scopes /subscriptions/$(az account show --query id -o tsv) \
  --sdk-auth
```

Save the full JSON output — you'll paste it into `AZURE_CREDENTIALS` in GitHub and use it to create the Azure DevOps service connection.

#### Step 3 — Bootstrap infrastructure manually (first time only)

The pipelines build and push Docker images in Stage 1, **before** Stage 2 creates the ACR. On first run this fails — ACR doesn't exist yet. Run Terraform manually once to create it:

```bash
cd infrastructure
terraform init
terraform apply -var="prefix=zcommerce" -var="environment=dev" -auto-approve
```

After this succeeds, copy the ACR login server from the output:

```bash
terraform output acr_login_server
# e.g. zcommercecommerceacrdev.azurecr.io
```

#### Step 4 — Set up Azure DevOps pipeline *(see Option A below)*

#### Step 5 — Set up GitHub Actions pipeline *(see Option B below)*

#### Step 6 — Trigger both pipelines

```bash
git push azure main   # triggers Azure DevOps
git push github main  # triggers GitHub Actions
```

---

### Pipeline overview

Each concern has its own pipeline file, triggered by path. Only the changed layer runs:

| Pipeline      | Azure DevOps file           | GitHub Actions file | Triggers on                             |
|---------------|-----------------------------|---------------------|-----------------------------------------|
| **App**       | `app-pipeline.yml`          | `app.yml`           | `services/**`, `frontend/**`, `helm/**` |
| **Infra**     | `infra-pipeline.yml`        | `infra.yml`         | `infrastructure/**`                     |
| **Bootstrap** | `bootstrap-pipeline.yml`    | `bootstrap.yml`     | Manual only (run once after AKS)        |

```text
App pipeline (every code push):
  Stage 1 — Build: 5 Docker images built in parallel (matrix) → pushed to ACR
  Stage 2 — Deploy: image.tag updated in helm/values.yaml → committed to Git
             ArgoCD detects the commit → rolls out new pods automatically

Infra pipeline (only when infrastructure/ changes):
  Stage 1 — Plan: terraform fmt + validate + plan → artifact uploaded
  Stage 2 — Apply: [manual approval] terraform apply → AKS, ACR, Log Analytics

Bootstrap pipeline (manual, run once after first terraform apply):
  ├── Install NGINX Ingress Controller
  ├── Install cert-manager + Let's Encrypt ClusterIssuer
  ├── Install Prometheus + Grafana
  ├── Install Loki
  ├── Install ArgoCD
  └── Register ArgoCD Application → ArgoCD owns all future deployments
```

---

### Option A — Azure DevOps Pipeline

#### Step 1: Create an Azure DevOps project

1. Go to https://dev.azure.com
2. Create a new project: `ZingyCommerce`
3. Push the repo to Azure Repos: `git push azure main`

#### Step 2: Create service connections

In **Project Settings → Service Connections**:

| Name              | Type                   | Purpose                      |
|-------------------|------------------------|------------------------------|
| `azure-zcommerce` | Azure Resource Manager | Terraform + AKS + ACR login  |

> No Docker Registry service connection needed — pipelines use `az acr login` with the Azure service connection.

#### Step 3: Set pipeline variables

Add these to each pipeline (Pipelines → select pipeline → Edit → Variables):

| Variable                   | Value                                   | Secret? |
|----------------------------|-----------------------------------------|---------|
| `AZURE_SERVICE_CONNECTION` | `azure-zcommerce`                       | No      |
| `ACR_LOGIN_SERVER`         | `zcommerceecommerceacrdev.azurecr.io`   | No      |
| `TF_STORAGE_ACCOUNT`       | `zcommercetfstate`                      | No      |
| `TF_RESOURCE_GROUP`        | `zcommerce-tfstate-rg`                  | No      |
| `GIT_USER_EMAIL`           | e.g. `ci@yourdomain.com`                | No      |
| `GIT_USER_NAME`            | `ZingyCommerce CI`                      | No      |

#### Step 4: Create the three pipelines

Repeat for each YAML file — **Pipelines → New Pipeline → Existing Azure Pipelines YAML file**:

| Pipeline      | YAML file                                    |
|---------------|----------------------------------------------|
| App           | `.azure-pipelines/app-pipeline.yml`          |
| Infra         | `.azure-pipelines/infra-pipeline.yml`        |
| Bootstrap     | `.azure-pipelines/bootstrap-pipeline.yml`    |

---

### Option B — GitHub Actions Pipeline

#### Step 1: Add secrets

In GitHub → **Settings → Secrets and variables → Actions**:

| Secret               | Value                                                                            |
|----------------------|----------------------------------------------------------------------------------|
| `AZURE_CREDENTIALS`  | Full JSON from `az ad sp create-for-rbac --output json`                          |
| `ACR_LOGIN_SERVER`   | `zcommerceecommerceacrdev.azurecr.io` (from `terraform output acr_login_server`) |
| `TF_STORAGE_ACCOUNT` | `zcommercetfstate`                                                               |
| `TF_RESOURCE_GROUP`  | `zcommerce-tfstate-rg`                                                           |
| `GIT_USER_EMAIL`     | e.g. `ci@yourdomain.com`                                                         |
| `GIT_USER_NAME`      | `ZingyCommerce CI`                                                               |

> `ACR_USERNAME` and `ACR_PASSWORD` are **not needed** — ACR admin is disabled. Pipelines authenticate via `az acr login` using the service principal in `AZURE_CREDENTIALS`.

#### Step 2: Create the approval environment

In GitHub → **Settings → Environments → New environment**: name it `production` and add yourself as a required reviewer. This is the manual gate before `terraform apply`.

#### Step 3: Push to trigger

```bash
git push github main
# app.yml triggers automatically for service/frontend/helm changes
# infra.yml triggers automatically for infrastructure/ changes
# bootstrap.yml is manual — run once from Actions → Bootstrap Cluster
```

---

## 11. Part E: Monitoring

After Terraform + bootstrap, your monitoring stack is live.

### Access Grafana

```
URL: https://grafana.yourdomain.com
Username: admin
Password: (what you set in monitoring/prometheus/values.yaml)
```

The **ZingyCommerce dashboard** is pre-installed and shows:
- Running pod count
- Pod restarts (highlights crashes)
- Request rate per service (req/s)
- p95 response latency per service
- CPU and memory usage per pod
- HTTP 5xx error rate

### Access Prometheus directly

```bash
# Port-forward for direct access (no Ingress needed)
kubectl port-forward svc/kube-prometheus-stack-prometheus \
  -n monitoring 9090:9090

# Open: http://localhost:9090
# Try a query: rate(http_requests_total[5m])
```

### Search logs with Loki

In Grafana → **Explore** → select **Loki** data source → run:
```
{namespace="zcommerce"} |= "error"
{app="api-gateway"} | json | status >= 500
```

### Add alerts (optional)

Edit `monitoring/prometheus/values.yaml` to add Alertmanager routes (Slack, PagerDuty, email).

---

## 12. Testing

### Quick API tests (curl)

```bash
BASE="https://zingycommerce.yourdomain.com/api"

# Health checks
curl $BASE/users/health
curl $BASE/products/health
curl $BASE/orders/health

# Register a user
curl -X POST $BASE/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com","password":"secret123"}'

# Login → get JWT token
TOKEN=$(curl -s -X POST $BASE/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"secret123"}' \
  | jq -r '.token')

# Browse products (public, no token needed)
curl $BASE/products

# Place an order (requires JWT)
curl -X POST $BASE/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":1,"quantity":2}]}'
```

### Check Kubernetes health

```bash
# All pods running?
kubectl get pods -n zcommerce

# Any recent restarts?
kubectl get pods -n zcommerce | grep -v "1/1\|2/2"

# Logs for a specific service
kubectl logs -n zcommerce -l app.kubernetes.io/name=api-gateway --tail=50

# HPA status (is autoscaling working?)
kubectl get hpa -n zcommerce
```

### Simulate load (watch autoscaling)

```bash
# Run 100 concurrent requests
kubectl run -it --rm load-test --image=busybox --restart=Never -- \
  sh -c 'for i in $(seq 1 100); do wget -q -O- http://api-gateway:3000/products; done'

# Watch HPA react
watch kubectl get hpa -n zcommerce
```

---

## 13. Cost Estimate

Monthly cost for the **dev** environment (1 AKS node, minimal replicas):

| Resource | Approx Cost |
|----------|-------------|
| AKS node pool (1x Standard_B2s) | ~$30/month |
| Azure Container Registry (Basic) | ~$5/month |
| Log Analytics (< 5 GB/month) | Free |
| Load Balancer (NGINX Ingress) | ~$18/month |
| Bandwidth (minimal) | ~$2/month |
| **Total (dev)** | **~$55/month** |

**Stop costs when not using:**
```bash
# Stop the AKS node pool (cluster still exists, no node charges)
az aks stop --resource-group zcommerce-ecommerce-dev-rg --name zcommerce-aks-dev

# Restart later
az aks start --resource-group zcommerce-ecommerce-dev-rg --name zcommerce-aks-dev

# Destroy everything (free tier / development done)
terraform destroy -var="prefix=zcommerce" -var="environment=dev"
```

---

## 14. Troubleshooting

### Pods stuck in `Pending`
```bash
kubectl describe pod <pod-name> -n zcommerce
# Look for "Events" at the bottom — usually an image pull error or resource limit
```

### `ImagePullBackOff` error
```bash
# The pod can't pull the image from ACR. Check:
# 1. The AcrPull role is assigned to the AKS kubelet identity (done by Terraform)
# 2. The image tag in values.yaml matches a tag that was pushed
kubectl describe pod <pod-name> -n zcommerce | grep -A5 "Events"
```

### ArgoCD not syncing
```bash
# Check ArgoCD app status
kubectl get application -n argocd
kubectl describe application zingycommerce -n argocd

# Force a manual sync
kubectl patch application zingycommerce -n argocd \
  --type merge -p '{"operation":{"sync":{}}}'
```

### Grafana showing "No data"
```bash
# Check Prometheus can reach your pods
kubectl port-forward svc/kube-prometheus-stack-prometheus -n monitoring 9090:9090
# Open http://localhost:9090/targets — look for zingycommerce-pods job
```

### cert-manager not issuing certificates
```bash
kubectl get certificate -n zcommerce
kubectl describe certificate zingycommerce-tls -n zcommerce
# Common cause: DNS not propagated yet, or port 80 not reachable
```

### Terraform plan shows unexpected changes
```bash
# Refresh state to sync Terraform's view with actual Azure resources
terraform refresh -var="prefix=zcommerce" -var="environment=dev"
```

---

## Useful Commands Reference

```bash
# ── Helm ──────────────────────────────────────────────────
helm list -n zcommerce                        # list deployed releases
helm history zingycommerce -n zcommerce       # deployment history
helm rollback zingycommerce 1 -n zcommerce    # roll back to revision 1

# ── ArgoCD CLI ─────────────────────────────────────────────
argocd app list
argocd app sync zingycommerce
argocd app history zingycommerce
argocd app rollback zingycommerce 2

# ── Kubernetes ────────────────────────────────────────────
kubectl get all -n zcommerce
kubectl logs -n zcommerce deploy/api-gateway -f
kubectl exec -it -n zcommerce deploy/user-service -- sh
kubectl top pods -n zcommerce

# ── Terraform ─────────────────────────────────────────────
terraform show                                # current state
terraform output                              # print all outputs
terraform plan -target=azurerm_kubernetes_cluster.main  # plan one resource
```
