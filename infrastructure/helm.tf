# ============================================================
# helm.tf — Kubernetes tooling
#
# NOTE: Helm releases are NOT managed by Terraform.
#
# Why: The helm and kubectl providers require AKS kubeconfig
# to initialise, but AKS is created by this same Terraform
# run. Terraform tries to configure all providers during
# `terraform plan` — before AKS exists — which fails with
# "Invalid provider configuration: depends on values that
# cannot be determined until apply."
#
# Where tooling is installed instead:
#   .azure-pipelines/bootstrap-pipeline.yml  (Azure DevOps)
#   .github/workflows/bootstrap.yml          (GitHub Actions)
#
# Run the bootstrap pipeline ONCE after `terraform apply`
# creates the AKS cluster. It installs:
#   - NGINX Ingress Controller
#   - cert-manager + Let's Encrypt ClusterIssuer
#   - Prometheus + Grafana (kube-prometheus-stack)
#   - Loki log aggregation
#   - ArgoCD (takes over all future app deployments)
# ============================================================
