// =====================================================
// ZingyCommerce — PDF Generator (updated: Helm, ArgoCD, Monitoring)
// Run: node generate-pdf.js
// Output: ZingyCommerce-Project-Report.pdf
// =====================================================

const PDFDocument = require('pdfkit');
const fs = require('fs');

const C = {
  darkBg:  '#0f0f1a',
  cardBg:  '#1a1a2e',
  brand:   '#6c3bff',
  brand2:  '#a855f7',
  accent:  '#f0a500',
  white:   '#f0f0ff',
  muted:   '#9d9dbf',
  success: '#22c55e',
  danger:  '#ef4444',
  info:    '#3b82f6',
  border:  '#2a2a4a',
};

function hex(h) {
  const v = h.replace('#','');
  return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16)];
}

const doc = new PDFDocument({
  size: 'A4',
  layout: 'landscape',
  margins: { top:0, bottom:0, left:0, right:0 },
  autoFirstPage: false,
  info: {
    Title:   'ZingyCommerce — Project Report',
    Author:  'ZingyCommerce Team (zcommerce)',
    Subject: 'Production-Ready Ecommerce Microservices on Azure',
  },
});

const W = 841.89;
const H = 595.28;
const PAD = 40;

doc.pipe(fs.createWriteStream('ZingyCommerce-Project-Report.pdf'));

// ── helpers ──────────────────────────────────────────────────────────────────
function bg(color = C.darkBg) {
  doc.rect(0, 0, W, H).fill(color);
}

function rect(x, y, w, h, color, radius = 8) {
  doc.roundedRect(x, y, w, h, radius).fill(color);
}

function line(x1, y1, x2, y2, color, width = 1) {
  doc.moveTo(x1, y1).lineTo(x2, y2).stroke(color).lineWidth(width);
}

function txt(text, x, y, opts = {}) {
  const { size=12, color=C.white, width, align='left', bold=false } = opts;
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
     .fontSize(size).fillColor(color)
     .text(text, x, y, { width, align, lineBreak: !!width });
}

function chip(label, x, y, color) {
  const cw = doc.widthOfString(label, { fontSize: 9 }) + 16;
  rect(x, y - 2, cw, 18, color + '33', 9);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(color)
     .text(label, x + 8, y + 1, { lineBreak: false });
  return cw + 8;
}

function card(x, y, w, h, title, body, opts = {}) {
  const { accent = C.brand, chips = [] } = opts;
  rect(x, y, w, h, C.cardBg);
  doc.rect(x, y, 3, h).fill(accent);
  txt(title, x + 12, y + 10, { size: 11, bold: true });
  if (chips.length) {
    let cx = x + 12;
    chips.forEach(([l, col]) => { cx += chip(l, cx, y + 26, col); });
  }
  txt(body, x + 12, chips.length ? y + 48 : y + 28,
      { size: 9, color: C.muted, width: w - 24 });
}

function sectionTitle(title, subtitle) {
  txt(title, PAD, 30, { size: 26, bold: true });
  if (subtitle) txt(subtitle, PAD, 62, { size: 12, color: C.muted, width: W - 2*PAD });
  line(PAD, 85, W - PAD, 85, C.border, 0.5);
}

function pageNum(n, total) {
  txt(`${n} / ${total}`, W - PAD - 40, H - 24, { size: 9, color: C.muted });
}

// ── PAGE 1 — Cover ────────────────────────────────────────────────────────────
doc.addPage();
bg();

// gradient stripe (solid fallback — pdfkit gradient API varies by version)
rect(0, 0, 6, H, C.brand);

txt('ZingyCommerce', PAD + 16, 100, { size: 52, bold: true });
txt('Production-Ready Ecommerce', PAD + 16, 165, { size: 22, color: C.brand2 });
txt('Microservices on Azure', PAD + 16, 192, { size: 22, color: C.brand2 });

const badges = [
  ['Microservices', C.brand], ['Docker', C.info], ['Kubernetes (AKS)', C.success],
  ['Helm', C.accent], ['ArgoCD GitOps', C.brand2], ['Terraform', C.brand],
  ['Prometheus + Grafana', C.success], ['cert-manager', C.info],
];
let bx = PAD + 16, by = 240;
badges.forEach(([l, col]) => {
  const bw = doc.widthOfString(l, { fontSize: 10 }) + 24;
  rect(bx, by, bw, 24, col + '22', 12);
  doc.rect(bx, by, bw, 24).stroke(col).lineWidth(0.5);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(col)
     .text(l, bx + 12, by + 6, { lineBreak: false });
  bx += bw + 10;
  if (bx > W - 200) { bx = PAD + 16; by += 34; }
});

txt('Built with zcommerce Azure resources', PAD + 16, H - 80,
    { size: 11, color: C.muted });
txt('5 Node.js microservices  ·  Helm chart  ·  GitOps with ArgoCD  ·  Full observability stack',
    PAD + 16, H - 60, { size: 10, color: C.muted });

// right panel — tech summary
rect(W - 260, 80, 220, H - 120, C.cardBg);
txt('STACK OVERVIEW', W - 248, 96, { size: 10, bold: true, color: C.accent });
const stack = [
  ['Services',    '5 × Node.js / Express'],
  ['Container',   'Docker multi-stage'],
  ['Orchestration','AKS + Kubernetes'],
  ['Helm',        'Chart with _helpers.tpl'],
  ['GitOps',      'ArgoCD Application CRD'],
  ['IaC',         'Terraform (azurerm ~3.100)'],
  ['Pipeline',    'Azure DevOps + GitHub Actions'],
  ['Metrics',     'Prometheus + Grafana'],
  ['Logs',        'Loki + Promtail'],
  ['TLS',         'cert-manager + Let\'s Encrypt'],
  ['Ingress',     'NGINX Ingress Controller'],
  ['Registry',    'Azure Container Registry'],
  ['Prefix',      'zcommerce'],
];
stack.forEach(([k, v], i) => {
  const ry = 116 + i * 26;
  txt(k, W - 248, ry, { size: 9, bold: true, color: C.brand2 });
  txt(v, W - 175, ry, { size: 9, color: C.white });
});

pageNum(1, 13);

// ── PAGE 2 — Architecture ─────────────────────────────────────────────────────
doc.addPage();
bg();
sectionTitle('Architecture', 'Single public IP → NGINX Ingress → services → pods → databases');

const arch = [
  { label: 'INTERNET (HTTPS)', x: 360, y: 100, w: 130, color: C.accent },
  { label: 'Azure Load Balancer', x: 330, y: 155, w: 190, color: C.info },
  { label: 'NGINX Ingress Controller', x: 300, y: 210, w: 250, color: C.brand },
  { label: 'API Gateway :3000', x: 160, y: 275, w: 160, color: C.brand2 },
  { label: 'Frontend (nginx :80)', x: 530, y: 275, w: 160, color: C.muted },
  { label: 'User Svc :3001', x:  60, y: 355, w: 130, color: C.success },
  { label: 'Product Svc :3002', x: 210, y: 355, w: 130, color: C.success },
  { label: 'Order Svc :3003', x: 360, y: 355, w: 130, color: C.success },
];

arch.forEach(({ label, x, y, w, color }) => {
  rect(x, y, w, 32, color + '22', 6);
  doc.rect(x, y, w, 32).stroke(color).lineWidth(0.8);
  doc.font('Helvetica').fontSize(9).fillColor(color)
     .text(label, x + 6, y + 10, { width: w - 12, align: 'center', lineBreak: false });
});

// arrows
const arrows = [
  [425, 132, 425, 155], [425, 187, 425, 210],
  [400, 242, 240, 275], [440, 242, 610, 275],
  [240, 307, 160, 355], [240, 307, 275, 355], [240, 307, 425, 355],
];
arrows.forEach(([x1,y1,x2,y2]) => line(x1,y1,x2,y2, C.muted, 0.8));

// monitoring panel (right)
rect(W - 210, 100, 170, 200, C.cardBg);
txt('MONITORING', W - 198, 114, { size: 10, bold: true, color: C.accent });
[
  ['Prometheus', 'Scrapes metrics', C.success],
  ['Grafana', 'Dashboards & alerts', C.brand2],
  ['Loki', 'Log aggregation', C.info],
  ['cert-manager', 'Auto TLS certs', C.accent],
  ['ArgoCD', 'GitOps CD', C.brand],
].forEach(([tool, desc, col], i) => {
  const ry = 136 + i * 33;
  rect(W - 198, ry, 150, 26, col + '22', 4);
  txt(tool, W - 192, ry + 4, { size: 9, bold: true, color: col });
  txt(desc, W - 192, ry + 14, { size: 8, color: C.muted });
});

// argocd gitops flow
rect(PAD, 440, 480, 100, C.cardBg);
txt('GitOps Flow (ArgoCD)', PAD + 12, 452, { size: 11, bold: true, color: C.brand });
txt(
  'git push → CI builds Docker image → CI updates image.tag in values.yaml → commits to Git\n' +
  '→ ArgoCD detects change (polls every 3 min) → helm upgrade on AKS → rolling update → done',
  PAD + 12, 474, { size: 9, color: C.muted, width: 456 }
);

pageNum(2, 13);

// ── PAGE 3 — Microservices ────────────────────────────────────────────────────
doc.addPage();
bg();
sectionTitle('The 5 Microservices', 'Each service owns its data, runs in its own container, scales independently');

const svcs = [
  {
    name: 'API Gateway', port: '3000', accent: C.brand,
    chips: [['JWT Verify', C.brand], ['Proxy', C.info]],
    desc: 'Single entry point. Routes /users → User Svc, /products → Product Svc, /orders → Order Svc (JWT-protected). Morgan logging.',
  },
  {
    name: 'User Service', port: '3001', accent: C.success,
    chips: [['bcryptjs', C.success], ['JWT sign', C.brand2]],
    desc: 'POST /users/register (bcrypt hash pw), POST /users/login (returns JWT, 24h TTL), GET /users/:id. SQLite users table.',
  },
  {
    name: 'Product Service', port: '3002', accent: C.accent,
    chips: [['Search', C.accent], ['Stock', C.success]],
    desc: 'GET /products (?search, ?category), GET/POST/PUT/DELETE /products/:id, PATCH /products/:id/stock. Seeds 5 products on startup.',
  },
  {
    name: 'Order Service', port: '3003', accent: C.brand2,
    chips: [['axios → Product', C.brand2], ['SQLite', C.muted]],
    desc: 'POST /orders (calls Product Svc to reduce stock via axios), GET /orders, PATCH /orders/:id/status. Two tables: orders + order_items.',
  },
  {
    name: 'Frontend', port: '80', accent: C.info,
    chips: [['nginx:alpine', C.info], ['SPA', C.accent]],
    desc: 'Dark-theme glassmorphism SPA. Toast notifications, cart in localStorage, JWT stored in localStorage. Talks only to API Gateway.',
  },
];

const colW = (W - 2*PAD - 40) / 5;
svcs.forEach((s, i) => {
  const cx = PAD + i * (colW + 10);
  rect(cx, 100, colW, 420, C.cardBg);
  doc.rect(cx, 100, colW, 4).fill(s.accent);
  txt(s.name, cx + 10, 114, { size: 11, bold: true });
  txt(`:${s.port}`, cx + 10, 132, { size: 10, color: s.accent });
  let cy = 154;
  s.chips.forEach(([l, col]) => { chip(l, cx + 10, cy, col); cy += 22; });
  txt(s.desc, cx + 10, cy + 10, { size: 8.5, color: C.muted, width: colW - 20 });
  txt('GET /health', cx + 10, 450, { size: 8, color: C.success });
  txt('Kubernetes probe', cx + 10, 464, { size: 7, color: C.muted });
});

pageNum(3, 13);

// ── PAGE 4 — Helm Chart ───────────────────────────────────────────────────────
doc.addPage();
bg();
sectionTitle('Helm Chart', 'Kubernetes package manager — one command deploys all 5 services');

const helmCols = [
  {
    title: 'Chart Structure',
    items: [
      ['Chart.yaml', 'Chart metadata + version'],
      ['values.yaml', 'Default config (base)'],
      ['values-dev.yaml', '1 replica, pullPolicy: Always'],
      ['values-prod.yaml', '3 replicas, TLS on, HPA min 3'],
      ['templates/_helpers.tpl', 'Reusable template macros'],
      ['templates/*/deployment.yaml', 'Deployment per service'],
      ['templates/*/service.yaml', 'ClusterIP Service per svc'],
      ['templates/ingress.yaml', 'NGINX Ingress routing'],
      ['templates/hpa.yaml', 'HPA for all 5 services'],
      ['templates/namespace.yaml', 'ecommerce namespace'],
    ],
  },
  {
    title: '_helpers.tpl Macros',
    items: [
      ['zingycommerce.image', 'ACR_URL/service-name:tag'],
      ['zingycommerce.labels', 'Standard K8s labels'],
      ['zingycommerce.selectorLabels', 'Pod selector (matchLabels)'],
      ['zingycommerce.probes', 'liveness + readiness probes'],
    ],
  },
  {
    title: 'Key Helm Commands',
    items: [
      ['helm upgrade --install ...', 'Install or upgrade release'],
      ['helm list -n ecommerce', 'List deployed releases'],
      ['helm history zingycommerce', 'See all past revisions'],
      ['helm rollback zingycommerce 1', 'Rollback to revision 1'],
      ['helm diff upgrade ...', 'Preview diff (needs plugin)'],
    ],
  },
];

helmCols.forEach(({ title, items }, i) => {
  const cw = (W - 2*PAD - 40) / 3;
  const cx = PAD + i * (cw + 20);
  rect(cx, 100, cw, items.length * 36 + 50, C.cardBg);
  doc.rect(cx, 100, cw, 3).fill(C.brand);
  txt(title, cx + 12, 112, { size: 11, bold: true });
  items.forEach(([k, v], j) => {
    const ry = 136 + j * 36;
    rect(cx + 12, ry, cw - 24, 28, C.darkBg, 4);
    txt(k, cx + 18, ry + 5, { size: 8.5, bold: true, color: C.accent });
    txt(v, cx + 18, ry + 16, { size: 8, color: C.muted });
  });
});

// HPA info
rect(PAD, 440, W - 2*PAD, 100, C.cardBg);
txt('HPA (Horizontal Pod Autoscaler)', PAD + 12, 452, { size: 11, bold: true, color: C.brand2 });
txt(
  'All 5 services have HPAs. They automatically add/remove pod replicas based on CPU (target 70%) and Memory (target 80%).\n' +
  'Dev: min 1 / max 3   |   Prod: min 3 / max 10   |   K8s checks every 15 seconds using Metrics Server.',
  PAD + 12, 474, { size: 9, color: C.muted, width: W - 2*PAD - 24 }
);

pageNum(4, 13);

// ── PAGE 5 — ArgoCD GitOps ───────────────────────────────────────────────────
doc.addPage();
bg();
sectionTitle('ArgoCD — GitOps Continuous Delivery', '"Git is the source of truth for what runs in Kubernetes"');

// flow diagram
const steps = [
  { label: '1. Developer\npushes code', col: C.brand },
  { label: '2. CI builds\nDocker image', col: C.info },
  { label: '3. CI updates\nimage.tag in\nvalues.yaml', col: C.accent },
  { label: '4. Commits &\npushes to\nmain branch', col: C.brand2 },
  { label: '5. ArgoCD\ndetects Git\nchange', col: C.success },
  { label: '6. helm upgrade\nrolling update\non AKS', col: C.brand },
];

steps.forEach((s, i) => {
  const bx = PAD + i * ((W - 2*PAD - 60) / 6 + 12);
  rect(bx, 100, 120, 100, s.col + '22', 8);
  doc.rect(bx, 100, 120, 100).stroke(s.col).lineWidth(0.8);
  txt(s.label, bx + 10, 128, { size: 9, color: s.col, width: 100, align: 'center' });
  if (i < 5) {
    doc.moveTo(bx + 120, 150).lineTo(bx + 132, 150).stroke(C.muted).lineWidth(1);
    txt('→', bx + 124, 144, { size: 12, color: C.muted });
  }
});

const cards2 = [
  {
    title: 'application.yaml',
    body:  'ArgoCD Application CRD. Points to helm/zingycommerce/ in Git. valueFiles: [values.yaml, values-prod.yaml]. automated.prune + selfHeal enabled.',
    col: C.brand,
  },
  {
    title: 'appproject.yaml',
    body:  'RBAC boundary. Restricts which Git repos and K8s namespaces ArgoCD can touch. Defines "deployer" role for CI token.',
    col: C.brand2,
  },
  {
    title: 'install.yaml',
    body:  'Patches ArgoCD to run in insecure mode (TLS at Ingress). Adds NGINX Ingress for https://argocd.chikwex.io.',
    col: C.info,
  },
  {
    title: 'Why GitOps beats imperative CD',
    body:  'Every deploy = a Git commit. Rollback = git revert. Drift detection: if someone kubectl-edits a resource, ArgoCD reverts it. CI needs no kubectl creds.',
    col: C.success,
  },
];

const cw3 = (W - 2*PAD - 30) / 4;
cards2.forEach(({ title, body, col }, i) => {
  card(PAD + i*(cw3+10), 220, cw3, 180, title, body, { accent: col });
});

pageNum(5, 13);

// ── PAGE 6 — Terraform ────────────────────────────────────────────────────────
doc.addPage();
bg();
sectionTitle('Terraform — Infrastructure as Code', 'Every Azure resource described in .tf files. `terraform apply` creates everything.');

const tfFiles = [
  { file: 'main.tf',      desc: 'azurerm provider, resource group, remote state backend (Azure Blob)', col: C.brand },
  { file: 'variables.tf', desc: 'prefix="zcommerce", environment, location, node_count, node_vm_size, acr_sku', col: C.brand2 },
  { file: 'acr.tf',       desc: 'Azure Container Registry + AcrPull role for AKS kubelet identity', col: C.accent },
  { file: 'aks.tf',       desc: 'AKS cluster (SystemAssigned identity, auto-scaling node pool, OMS agent)', col: C.success },
  { file: 'monitoring.tf',desc: 'Log Analytics Workspace, AKS diagnostic settings (API server + audit logs)', col: C.info },
  { file: 'helm.tf',      desc: 'Helm provider: installs NGINX Ingress, cert-manager, Prometheus stack, Loki, ArgoCD', col: C.brand },
  { file: 'outputs.tf',   desc: 'acr_login_server, aks_cluster_name, resource_group_name, connect command', col: C.muted },
];

tfFiles.forEach(({ file, desc, col }, i) => {
  const ry = 100 + i * 52;
  rect(PAD, ry, 500, 42, C.cardBg);
  doc.rect(PAD, ry, 3, 42).fill(col);
  txt(file, PAD + 12, ry + 8, { size: 11, bold: true });
  txt(desc, PAD + 12, ry + 24, { size: 9, color: C.muted, width: 480 });
});

// resources created
rect(580, 100, W - 580 - PAD, 460, C.cardBg);
txt('Resources Created', 592, 114, { size: 11, bold: true, color: C.accent });
const resources = [
  ['Resource Group', 'zcommerce-ecommerce-<env>-rg'],
  ['ACR', 'zcommercecommerceacr<env>'],
  ['AKS', 'zcommerce-aks-<env>'],
  ['Log Analytics', 'zcommerce-logs-<env>'],
  ['NGINX Ingress', 'ingress-nginx namespace'],
  ['cert-manager', 'cert-manager namespace'],
  ['ClusterIssuer', 'letsencrypt-prod'],
  ['Prometheus', 'monitoring namespace'],
  ['Grafana', 'monitoring namespace'],
  ['Loki', 'monitoring namespace'],
  ['ArgoCD', 'argocd namespace'],
];
resources.forEach(([k,v], i) => {
  const ry = 138 + i * 36;
  txt('·', 592, ry, { size: 14, color: C.brand });
  txt(k, 606, ry, { size: 9, bold: true });
  txt(v, 606, ry + 12, { size: 8, color: C.muted });
});

pageNum(6, 13);

// ── PAGE 7 — CI/CD Pipeline ───────────────────────────────────────────────────
doc.addPage();
bg();
sectionTitle('CI/CD Pipelines — Azure DevOps + GitHub Actions', '3-stage pipeline: validate → provision → bootstrap (identical on both remotes)');

const stages = [
  {
    stage: 'Stage 1: CI', col: C.brand,
    jobs: [
      { title: 'TerraformValidate (parallel)', steps: ['terraform init', 'terraform fmt --check', 'terraform validate', 'terraform plan -out=tfplan', 'publish plan artifact'] },
      { title: 'BuildAndUpdateHelm (parallel)', steps: ['docker build & push 5 images to ACR (tag = git SHA)', 'Install yq (YAML processor)', 'yq update image.tag in values.yaml', 'git commit + push [skip ci]', 'ArgoCD detects new tag → rolls out pods'] },
    ],
  },
  {
    stage: 'Stage 2: TerraformApply', col: C.accent,
    jobs: [
      { title: 'ApplyInfrastructure [manual approval]', steps: ['download plan artifact', 'terraform init', 'terraform apply -auto-approve tfplan', 'export AKS name + ACR URL as output vars'] },
    ],
  },
  {
    stage: 'Stage 3: BootstrapCluster', col: C.success,
    jobs: [
      { title: 'Bootstrap [first-run setup]', steps: ['helm install ingress-nginx', 'helm install cert-manager + ClusterIssuer', 'helm install kube-prometheus-stack', 'helm install loki-stack', 'kubectl apply argocd/install.yaml', 'kubectl apply argocd/appproject.yaml', 'kubectl apply argocd/application.yaml ← ArgoCD live!'] },
    ],
  },
];

let sx = PAD;
stages.forEach(({ stage, col, jobs }) => {
  const sw = (W - 2*PAD - 20) / 3;
  rect(sx, 100, sw, 400, C.cardBg);
  doc.rect(sx, 100, sw, 4).fill(col);
  txt(stage, sx + 12, 114, { size: 11, bold: true, color: col });
  let jy = 140;
  jobs.forEach(({ title, steps }) => {
    txt(title, sx + 12, jy, { size: 9, bold: true, color: C.white });
    jy += 18;
    steps.forEach(step => {
      txt(`  › ${step}`, sx + 12, jy, { size: 8, color: C.muted, width: sw - 24 });
      jy += 24;
    });
    jy += 8;
  });
  sx += sw + 10;
});

pageNum(7, 13);

// ── PAGE 8 — Monitoring ──────────────────────────────────────────────────────
doc.addPage();
bg();
sectionTitle('Monitoring — Prometheus + Grafana + Loki', 'Full observability: metrics, dashboards, alerts, and log search');

const monCards = [
  {
    title: 'Prometheus',
    col: C.success,
    items: [
      'Pulls metrics every 15s from all pods',
      'Auto-discovers ZingyCommerce pods via annotations:',
      '  prometheus.io/scrape: "true"',
      '  prometheus.io/port: "3001"',
      'Stores 15 days of time-series data',
      '20 GB persistent volume on AKS',
      'Queries via PromQL (Grafana uses this)',
      'URL: http://prometheus.monitoring:9090',
    ],
  },
  {
    title: 'Grafana',
    col: C.brand2,
    items: [
      'ZingyCommerce dashboard pre-installed',
      'Panels: running pods, restarts, req/s',
      'p95 latency per service',
      'CPU + memory usage per pod',
      '5xx error rate per service',
      'Loki log search integrated',
      'Refresh: every 30 seconds',
      'URL: https://grafana.zcommerce.io',
    ],
  },
  {
    title: 'Loki + Promtail',
    col: C.info,
    items: [
      'Promtail runs as DaemonSet on every node',
      'Tails /var/log/pods/* from all containers',
      'Adds labels: namespace, pod, app, container',
      'Only collects: zcommerce, monitoring, argocd',
      '30-day log retention, 20 GB volume',
      'Query in Grafana Explore with LogQL:',
      '  {namespace="zcommerce"} |= "error"',
      '  {app="api-gateway"} | json | status>=500',
    ],
  },
  {
    title: 'Alertmanager',
    col: C.accent,
    items: [
      'Bundled with kube-prometheus-stack',
      'Receives alerts from Prometheus rules',
      'Routes to: Slack, PagerDuty, email',
      'Example alert rules:',
      '  PodCrashLooping (restarts > 5/1h)',
      '  HighErrorRate (5xx > 5%)',
      '  ServiceDown (pod count = 0)',
      '  HighLatency (p95 > 2s)',
    ],
  },
];

const mw = (W - 2*PAD - 30) / 4;
monCards.forEach(({ title, col, items }, i) => {
  const cx = PAD + i * (mw + 10);
  rect(cx, 100, mw, 390, C.cardBg);
  doc.rect(cx, 100, mw, 3).fill(col);
  txt(title, cx + 12, 114, { size: 12, bold: true, color: col });
  items.forEach((item, j) => {
    txt((item.startsWith('  ') ? '' : '· ') + item.trimStart(),
        cx + 12, 140 + j * 28, { size: 8.5, color: item.startsWith('  ') ? C.success : C.muted, width: mw - 24 });
  });
});

pageNum(8, 13);

// ── PAGE 9 — Docker & Kubernetes ────────────────────────────────────────────
doc.addPage();
bg();
sectionTitle('Docker & Kubernetes', 'Multi-stage builds → ACR → AKS Deployments with rolling updates');

// docker col
rect(PAD, 100, 380, 380, C.cardBg);
txt('Dockerfile (all services)', PAD + 12, 114, { size: 11, bold: true, color: C.brand });
txt('Multi-stage build — smaller, more secure images:', PAD + 12, 136, { size: 9, color: C.muted });
const dockerLines = [
  'FROM node:20-alpine AS builder',
  'WORKDIR /app',
  'COPY package*.json ./',
  'RUN npm install --omit=dev',
  '',
  'FROM node:20-alpine',
  'WORKDIR /app',
  'COPY --from=builder /app/node_modules .',
  'COPY . .',
  'EXPOSE 3001',
  'CMD ["node", "src/index.js"]',
];
rect(PAD + 12, 154, 356, dockerLines.length * 22 + 16, '#0a0a14', 4);
dockerLines.forEach((l, i) => {
  if (l) txt(l, PAD + 22, 162 + i * 22, { size: 8.5, color: l.startsWith('FROM') ? C.brand2 : l.startsWith('RUN') || l.startsWith('CMD') ? C.accent : C.white });
});
txt('Frontend uses nginx:1.25-alpine (serves static files)', PAD + 12, 430, { size: 8, color: C.muted });

// k8s col
rect(PAD + 400, 100, W - PAD - 400 - PAD, 380, C.cardBg);
const ky = PAD + 400;
txt('Kubernetes Resources (per service)', ky + 12, 114, { size: 11, bold: true, color: C.brand2 });
const k8sConcepts = [
  ['Deployment', 'Manages pod replicas, rolling updates. replicaCount from Helm values.'],
  ['ClusterIP Service', 'Internal DNS name (e.g. user-service:3001). Not accessible externally.'],
  ['NGINX Ingress', 'Routes /api/* to api-gateway, /* to frontend. Single public IP.'],
  ['HPA', 'Auto-scales pods when CPU > 70% or Memory > 80%.'],
  ['Namespace', '"zcommerce" — logical isolation for all app pods.'],
  ['Secret', 'zingycommerce-secrets — JWT secret key, created once manually.'],
  ['Liveness Probe', 'K8s restarts pod if GET /health fails.'],
  ['Readiness Probe', 'K8s stops routing traffic to pod until /health passes.'],
];
k8sConcepts.forEach(([k, v], i) => {
  const ry = 140 + i * 42;
  txt(k, ky + 12, ry, { size: 9, bold: true, color: C.brand });
  txt(v, ky + 12, ry + 14, { size: 8, color: C.muted, width: W - PAD - 400 - PAD - 24 });
});

pageNum(9, 13);

// ── PAGE 10 — API Reference ──────────────────────────────────────────────────
doc.addPage();
bg();
sectionTitle('API Reference', 'All endpoints served through the API Gateway at /api/*');

const endpoints = [
  { method:'POST', path:'/api/users/register', auth:'public', desc:'Register new user. Body: {name, email, password}. Hashes password with bcrypt.' },
  { method:'POST', path:'/api/users/login',    auth:'public', desc:'Login. Returns JWT token (24h). Body: {email, password}.' },
  { method:'GET',  path:'/api/users/:id',       auth:'public', desc:'Get user profile by ID.' },
  { method:'GET',  path:'/api/products',        auth:'public', desc:'List products. Query: ?search=<term>&category=<cat>' },
  { method:'GET',  path:'/api/products/:id',    auth:'public', desc:'Get single product.' },
  { method:'POST', path:'/api/products',        auth:'public', desc:'Create product. Body: {name, price, category, stock, description}' },
  { method:'PUT',  path:'/api/products/:id',    auth:'public', desc:'Update product.' },
  { method:'DELETE',path:'/api/products/:id',  auth:'public', desc:'Delete product.' },
  { method:'POST', path:'/api/orders',          auth:'JWT',    desc:'Place order. Body: {items:[{productId,quantity}]}. Calls Product Svc to reduce stock.' },
  { method:'GET',  path:'/api/orders',          auth:'JWT',    desc:'List all orders.' },
  { method:'GET',  path:'/api/orders/:id',      auth:'JWT',    desc:'Get order detail.' },
  { method:'PATCH',path:'/api/orders/:id/status',auth:'JWT',  desc:'Update order status (pending→processing→shipped→delivered).' },
];

const methodColors = { GET: C.success, POST: C.brand, PUT: C.accent, DELETE: C.danger, PATCH: C.brand2 };
const colW2 = [60, 230, 50, W - 2*PAD - 60 - 230 - 50 - 30];
const headers = ['Method','Path','Auth','Description'];

// header row
let hx = PAD;
[C.brand, C.brand, C.brand, C.brand].forEach((c, i) => {
  txt(headers[i], hx + 8, 102, { size: 9, bold: true, color: C.accent });
  hx += colW2[i] + 10;
});
line(PAD, 116, W - PAD, 116, C.border);

endpoints.forEach(({ method, path, auth, desc }, i) => {
  const ry = 122 + i * 34;
  if (i % 2 === 0) rect(PAD, ry - 2, W - 2*PAD, 32, C.cardBg, 0);
  let ex = PAD;
  const col = methodColors[method] || C.white;
  rect(ex + 4, ry + 2, 52, 18, col + '22', 4);
  txt(method, ex + 8, ry + 6, { size: 8, bold: true, color: col }); ex += 70;
  txt(path, ex, ry + 8, { size: 8.5, color: C.white }); ex += 230;
  const authCol = auth === 'JWT' ? C.accent : C.success;
  rect(ex, ry + 4, 44, 16, authCol + '22', 4);
  txt(auth, ex + 4, ry + 8, { size: 7.5, bold: true, color: authCol }); ex += 60;
  txt(desc, ex, ry + 8, { size: 8, color: C.muted, width: colW2[3] });
});

pageNum(10, 13);

// ── PAGE 11 — Azure Resources & Security ────────────────────────────────────
doc.addPage();
bg();
sectionTitle('Azure Resources & Security', 'All resources use zcommerce prefix for easy identification and cost tracking');

const azureResources = [
  { name: 'AKS (Azure Kubernetes Service)', id: 'zcommerce-aks-<env>', col: C.brand,
    notes: 'SystemAssigned identity, auto-scaling 1–4 nodes, Standard_B2s (dev) / Standard_D2s_v3 (prod), OMS agent for Log Analytics.' },
  { name: 'ACR (Azure Container Registry)', id: 'zcommercecommerceacr<env>', col: C.brand2,
    notes: 'Basic SKU (~$5/mo). Stores all 5 Docker images. AcrPull role assigned to AKS kubelet identity (no passwords needed).' },
  { name: 'Log Analytics Workspace', id: 'zcommerce-logs-<env>', col: C.info,
    notes: 'PerGB2018 SKU. Receives AKS control-plane logs (api-server, scheduler, audit). 30-day retention. First 5 GB/month free.' },
  { name: 'Resource Group', id: 'zcommerce-ecommerce-<env>-rg', col: C.success,
    notes: 'All resources in one group — easy to see costs, delete everything together with one command.' },
  { name: 'Azure Load Balancer', id: 'auto-created by NGINX Ingress', col: C.accent,
    notes: 'One public IP. Created automatically when NGINX Ingress Controller Helm chart is installed. Routes to NGINX pods.' },
  { name: 'Terraform State (Blob Storage)', id: 'zcommercetfstate / tfstate container', col: C.muted,
    notes: 'Remote state enables team collaboration — everyone shares the same view of what Terraform created.' },
];

azureResources.forEach(({ name, id, col, notes }, i) => {
  const ry = 100 + i * 72;
  rect(PAD, ry, W - 2*PAD, 62, C.cardBg);
  doc.rect(PAD, ry, 3, 62).fill(col);
  txt(name, PAD + 12, ry + 8, { size: 10, bold: true });
  txt(id, PAD + 12, ry + 24, { size: 9, color: col });
  txt(notes, PAD + 12, ry + 38, { size: 8.5, color: C.muted, width: W - 2*PAD - 24 });
});

pageNum(11, 13);

// ── PAGE 12 — Summary & URLs ──────────────────────────────────────────────────
doc.addPage();
bg();
sectionTitle('Summary — Production-Ready Checklist', 'Everything in place for a real production deployment');

const checks = [
  { label: 'Microservices architecture',             done: true  },
  { label: 'JWT authentication + bcrypt passwords',  done: true  },
  { label: 'Docker multi-stage builds (slim images)',done: true  },
  { label: 'Docker Compose (local dev)',             done: true  },
  { label: 'Kubernetes Deployments + Services',      done: true  },
  { label: 'Helm chart (templatized, reusable)',     done: true  },
  { label: 'Dev vs Prod values files',              done: true  },
  { label: 'Horizontal Pod Autoscaling (HPA)',       done: true  },
  { label: 'Liveness + Readiness probes',            done: true  },
  { label: 'ArgoCD GitOps (auto-deploy on git push)',done: true  },
  { label: 'ArgoCD AppProject RBAC',                 done: true  },
  { label: 'Terraform Infrastructure as Code',       done: true  },
  { label: 'Azure DevOps 3-stage pipeline',         done: true  },
  { label: 'GitHub Actions 3-stage pipeline',       done: true  },
  { label: 'NGINX Ingress (single public IP)',       done: true  },
  { label: 'TLS/HTTPS (cert-manager + Let\'s Encrypt)',done:true },
  { label: 'Prometheus metrics scraping',            done: true  },
  { label: 'Grafana dashboard (pre-configured)',     done: true  },
  { label: 'Loki log aggregation',                   done: true  },
  { label: 'Log Analytics (AKS diagnostics)',        done: true  },
  { label: 'Terraform-managed Helm releases',        done: true  },
];

const half = Math.ceil(checks.length / 2);
[checks.slice(0, half), checks.slice(half)].forEach((col, ci) => {
  col.forEach(({ label, done }, i) => {
    const cx = ci === 0 ? PAD : PAD + (W - 2*PAD) / 2 + 10;
    const ry = 100 + i * 26;
    txt(done ? '✓' : '○', cx, ry, { size: 11, bold: true, color: done ? C.success : C.muted });
    txt(label, cx + 20, ry + 1, { size: 9, color: done ? C.white : C.muted });
  });
});

// URLs
rect(PAD, 440, W - 2*PAD, 100, C.cardBg);
txt('Live URLs (once deployed)', PAD + 12, 452, { size: 11, bold: true, color: C.accent });
const urls = [
  ['Shop Frontend', 'https://zingycommerce.zcommerce.io', C.success],
  ['ArgoCD UI', 'https://argocd.zcommerce.io', C.brand],
  ['Grafana Dashboards', 'https://grafana.zcommerce.io', C.brand2],
  ['API Gateway', 'https://zingycommerce.zcommerce.io/api', C.info],
];
urls.forEach(([label, url, col], i) => {
  const ux = PAD + 12 + i * (( W - 2*PAD - 24) / 4);
  txt(label, ux, 474, { size: 9, bold: true, color: col });
  txt(url, ux, 488, { size: 8, color: C.muted });
});

pageNum(12, 13);

// ── PAGE 13 — Pipeline Deployment Pre-flight ─────────────────────────────────
doc.addPage();
bg();
sectionTitle('Pipeline Deployment — 6 Steps in Order', 'Complete these before running any pipeline. Skipping any step causes the first run to fail.');

const preflightSteps = [
  {
    num: '1',
    title: 'Push Code to Both Remotes',
    cmd: 'git push -u github main\ngit push -u azure main',
    desc: 'Both pipelines watch the main branch. Code must exist on both remotes before any trigger fires.',
    col: C.brand,
  },
  {
    num: '2',
    title: 'Create a Service Principal',
    cmd: 'az ad sp create-for-rbac --name "zcommerce-pipeline-sp" \\\n  --role Contributor \\\n  --scopes /subscriptions/$(az account show --query id -o tsv) \\\n  --sdk-auth',
    desc: 'Save the full JSON output. Paste as AZURE_CREDENTIALS in GitHub Secrets and use it to create the Azure DevOps service connection.',
    col: C.brand2,
  },
  {
    num: '3',
    title: 'Bootstrap Infrastructure Manually (first time only)',
    cmd: 'cd infrastructure && terraform init\nterraform apply -var="prefix=zcommerce" -var="environment=dev" -auto-approve',
    desc: 'Stage 1 pushes images to ACR before Stage 2 creates it — ACR must exist first. Run once, then pipelines take over.',
    col: C.accent,
  },
  {
    num: '4',
    title: 'Set Up Azure DevOps Pipeline',
    cmd: 'New Pipeline → Existing YAML → .azure-pipelines/azure-pipelines.yml',
    desc: 'Add pipeline variables: ACR_LOGIN_SERVER, ACR_USERNAME, ACR_PASSWORD, TF_STORAGE_ACCOUNT. Create Azure RM service connection named "azure-service-connection".',
    col: C.info,
  },
  {
    num: '5',
    title: 'Set Up GitHub Actions Pipeline',
    cmd: 'Settings → Secrets → Actions → New repository secret',
    desc: 'Add: AZURE_CREDENTIALS (full SP JSON), ACR_LOGIN_SERVER, ACR_USERNAME, ACR_PASSWORD, TF_STORAGE_ACCOUNT, TF_RESOURCE_GROUP. Create a "production" environment with required reviewers.',
    col: C.success,
  },
  {
    num: '6',
    title: 'Trigger Both Pipelines',
    cmd: 'git push azure main   # triggers Azure DevOps\ngit push github main  # triggers GitHub Actions',
    desc: 'Each push triggers its pipeline independently. Stage 2 (Terraform Apply) requires manual approval before infrastructure changes are applied.',
    col: C.brand,
  },
];

const pfW = (W - 2*PAD - 20) / 2;
preflightSteps.forEach(({ num, title, cmd, desc, col }, i) => {
  const col_idx = i % 2;
  const row_idx = Math.floor(i / 2);
  const px = PAD + col_idx * (pfW + 20);
  const py = 100 + row_idx * 150;

  rect(px, py, pfW, 138, C.cardBg);
  doc.rect(px, py, 3, 138).fill(col);

  // step number badge
  rect(px + 12, py + 10, 22, 22, col + '33', 11);
  txt(num, px + 17, py + 14, { size: 10, bold: true, color: col });

  txt(title, px + 42, py + 14, { size: 10, bold: true });

  // command box
  rect(px + 12, py + 40, pfW - 24, cmd.split('\n').length * 14 + 12, '#0a0a14', 4);
  cmd.split('\n').forEach((line_text, li) => {
    txt(line_text, px + 20, py + 46 + li * 14, { size: 7.5, color: C.accent });
  });

  const descY = py + 40 + cmd.split('\n').length * 14 + 18;
  txt(desc, px + 12, descY, { size: 8, color: C.muted, width: pfW - 24 });
});

// pipeline map footer
const fY = H - 80;
rect(PAD, fY, W - 2*PAD, 50, C.cardBg);
txt('Pipeline Stages (Azure DevOps & GitHub Actions — identical)', PAD + 12, fY + 8, { size: 9, bold: true, color: C.accent });

const stageBoxes = [
  ['Stage 1: CI', 'Validate TF · Build images · Update Helm image.tag', C.brand],
  ['Stage 2: Terraform Apply  ✋', 'Manual approval gate · terraform apply', C.accent],
  ['Stage 3: Bootstrap K8s', 'NGINX · cert-manager · Prometheus · Loki · ArgoCD', C.success],
];
const sbW = (W - 2*PAD - 50) / 3;
stageBoxes.forEach(([label, sub, col], i) => {
  const sbX = PAD + 12 + i * (sbW + 13);
  rect(sbX, fY + 26, sbW, 18, col + '22', 4);
  txt(label, sbX + 6, fY + 30, { size: 8, bold: true, color: col });
  if (i < 2) txt('→', sbX + sbW + 3, fY + 30, { size: 9, color: C.muted });
});

pageNum(13, 13);

// ── Finalize ──────────────────────────────────────────────────────────────────
doc.end();
console.log('✓ ZingyCommerce-Project-Report.pdf generated (13 pages)');
