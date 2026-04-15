{{/*
_helpers.tpl — Reusable template snippets for ZingyCommerce Helm chart.

Helm calls these with {{ include "zingycommerce.<name>" . }}
*/}}

{{/* Chart name */}}
{{- define "zingycommerce.name" -}}
{{- .Chart.Name }}
{{- end }}

{{/* Full image path for a given service.
     Usage: {{ include "zingycommerce.image" (dict "root" . "service" "user-service") }}
*/}}
{{- define "zingycommerce.image" -}}
{{ .root.Values.global.acrLoginServer }}/{{ .service }}:{{ .root.Values.image.tag }}
{{- end }}

{{/* Common labels applied to every resource */}}
{{- define "zingycommerce.labels" -}}
app.kubernetes.io/part-of: zingycommerce
app.kubernetes.io/managed-by: Helm
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
environment: {{ .Values.global.environment }}
{{- end }}

{{/* Selector labels for a specific service (used in matchLabels + Service selector) */}}
{{- define "zingycommerce.selectorLabels" -}}
app.kubernetes.io/name: {{ . }}
app.kubernetes.io/part-of: zingycommerce
{{- end }}

{{/* Standard probe block. Pass the port as argument.
     Usage: {{ include "zingycommerce.probes" (dict "root" . "port" 3001) }}
*/}}
{{- define "zingycommerce.probes" -}}
livenessProbe:
  httpGet:
    path: {{ .root.Values.probes.liveness.path }}
    port: {{ .port }}
  initialDelaySeconds: {{ .root.Values.probes.liveness.initialDelaySeconds }}
  periodSeconds: {{ .root.Values.probes.liveness.periodSeconds }}
readinessProbe:
  httpGet:
    path: {{ .root.Values.probes.readiness.path }}
    port: {{ .port }}
  initialDelaySeconds: {{ .root.Values.probes.readiness.initialDelaySeconds }}
  periodSeconds: {{ .root.Values.probes.readiness.periodSeconds }}
{{- end }}
