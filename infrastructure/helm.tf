# ============================================================
# helm.tf — Cluster-level tooling via Terraform Helm provider
#
# Why manage Helm releases in Terraform?
#   The Helm provider lets Terraform install cluster tools
#   (NGINX Ingress, cert-manager, ArgoCD, monitoring) alongside
#   the Azure infra in a single `terraform apply`.
#   This means your ENTIRE stack — from the Azure resource group
#   to the Grafana dashboard — is captured in code and reproducible.
#
# Alternative: the CI/CD pipeline also installs these via Helm
#   (see azure-pipelines.yml Stage 3). Use ONE approach, not both.
#   Terraform is better for long-lived cluster tools.
#   The pipeline approach is better if you don't want Helm state
#   tracked in the Terraform state file.
# ============================================================

# ── Helm Provider ──────────────────────────────────────────
# The helm provider talks to your AKS cluster using the
# same credentials as the azurerm provider.
terraform {
  required_providers {
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
    kubectl = {
      source  = "gavinbunney/kubectl"
      version = "~> 1.14"
    }
  }
}

provider "helm" {
  kubernetes {
    host                   = azurerm_kubernetes_cluster.main.kube_config.0.host
    client_certificate     = base64decode(azurerm_kubernetes_cluster.main.kube_config.0.client_certificate)
    client_key             = base64decode(azurerm_kubernetes_cluster.main.kube_config.0.client_key)
    cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.main.kube_config.0.cluster_ca_certificate)
  }
}

provider "kubectl" {
  host                   = azurerm_kubernetes_cluster.main.kube_config.0.host
  client_certificate     = base64decode(azurerm_kubernetes_cluster.main.kube_config.0.client_certificate)
  client_key             = base64decode(azurerm_kubernetes_cluster.main.kube_config.0.client_key)
  cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.main.kube_config.0.cluster_ca_certificate)
  load_config_file       = false
}

# ── NGINX Ingress Controller ────────────────────────────────
# Creates an Azure Load Balancer with a public IP.
# All HTTPS traffic flows: Internet → LB → NGINX → your pods.
resource "helm_release" "ingress_nginx" {
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = "ingress-nginx"
  create_namespace = true
  version          = "4.10.1"   # pin for reproducibility

  set {
    name  = "controller.replicaCount"
    value = "2"
  }

  set {
    name  = "controller.service.annotations.service\\.beta\\.kubernetes\\.io/azure-load-balancer-health-probe-request-path"
    value = "/healthz"
  }

  # Tag the Azure LB with our project prefix for easy identification
  set {
    name  = "controller.service.annotations.service\\.beta\\.kubernetes\\.io/azure-dns-label-name"
    value = "${var.prefix}commerce"
  }

  depends_on = [azurerm_kubernetes_cluster.main]
}

# ── cert-manager ───────────────────────────────────────────
# Automatically provisions TLS certificates from Let's Encrypt.
# After install, every Ingress with cert-manager annotations
# gets a free, auto-renewing HTTPS certificate.
resource "helm_release" "cert_manager" {
  name             = "cert-manager"
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  namespace        = "cert-manager"
  create_namespace = true
  version          = "v1.14.5"

  set {
    name  = "installCRDs"
    value = "true"
  }

  depends_on = [helm_release.ingress_nginx]
}

# ── Let's Encrypt ClusterIssuer ───────────────────────────
# Tells cert-manager HOW to get certificates (via ACME/HTTP01).
# This is a Kubernetes Custom Resource (CRD installed by cert-manager).
resource "kubectl_manifest" "cluster_issuer" {
  yaml_body = <<-YAML
    apiVersion: cert-manager.io/v1
    kind: ClusterIssuer
    metadata:
      name: letsencrypt-prod
    spec:
      acme:
        server: https://acme-v02.api.letsencrypt.org/directory
        email: admin@chikwex.io
        privateKeySecretRef:
          name: letsencrypt-prod-key
        solvers:
          - http01:
              ingress:
                class: nginx
  YAML

  depends_on = [helm_release.cert_manager]
}

# ── Prometheus + Grafana ───────────────────────────────────
# kube-prometheus-stack = Prometheus + Grafana + Alertmanager
# + Node Exporter + Kube State Metrics — all in one chart.
resource "helm_release" "kube_prometheus_stack" {
  name             = "kube-prometheus-stack"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  namespace        = "monitoring"
  create_namespace = true
  version          = "58.7.2"

  # Point to our custom values file
  values = [file("${path.module}/../monitoring/prometheus/values.yaml")]

  # Give pods time to pull images and start
  timeout = 600

  depends_on = [
    helm_release.cert_manager,
    helm_release.ingress_nginx,
  ]
}

# ── Loki ──────────────────────────────────────────────────
# Log aggregation — collects and stores pod logs so you can
# search them in Grafana alongside your metrics.
resource "helm_release" "loki" {
  name             = "loki"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "loki-stack"
  namespace        = "monitoring"
  create_namespace = true
  version          = "2.10.2"

  values = [file("${path.module}/../monitoring/loki/values.yaml")]

  depends_on = [helm_release.kube_prometheus_stack]
}

# ── ArgoCD ────────────────────────────────────────────────
# GitOps CD tool — watches Git and syncs Kubernetes state.
resource "helm_release" "argocd" {
  name             = "argocd"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  namespace        = "argocd"
  create_namespace = true
  version          = "6.11.1"

  # Run ArgoCD in insecure mode — TLS is terminated at NGINX Ingress
  set {
    name  = "server.extraArgs[0]"
    value = "--insecure"
  }

  # Increase resource limits so ArgoCD can handle large repos
  set {
    name  = "server.resources.limits.cpu"
    value = "500m"
  }

  set {
    name  = "server.resources.limits.memory"
    value = "256Mi"
  }

  timeout = 600

  depends_on = [
    helm_release.ingress_nginx,
    helm_release.cert_manager,
  ]
}
