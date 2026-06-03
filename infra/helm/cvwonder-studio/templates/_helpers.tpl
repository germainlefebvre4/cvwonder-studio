{{/*
Expand the name of the chart.
*/}}
{{- define "cvwonder-studio.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited by the DNS naming spec.
If the release name contains the chart name it will be used as a full name.
*/}}
{{- define "cvwonder-studio.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart label.
*/}}
{{- define "cvwonder-studio.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to all resources.
*/}}
{{- define "cvwonder-studio.labels" -}}
helm.sh/chart: {{ include "cvwonder-studio.chart" . }}
{{ include "cvwonder-studio.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.commonMetaLabels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Selector labels used in Deployment and Service matchLabels.
*/}}
{{- define "cvwonder-studio.selectorLabels" -}}
app.kubernetes.io/name: {{ include "cvwonder-studio.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the ServiceAccount to use.
*/}}
{{- define "cvwonder-studio.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "cvwonder-studio.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Resolve the Secret name.
When existingSecret is set, reference that Secret.
Otherwise, use the chart-managed Secret (same name as fullname).
*/}}
{{- define "cvwonder-studio.secretName" -}}
{{- if .Values.existingSecret -}}
{{- .Values.existingSecret -}}
{{- else -}}
{{- include "cvwonder-studio.fullname" . -}}
{{- end -}}
{{- end }}

{{/*
Render the app container image reference, supporting digest pinning.
*/}}
{{- define "cvwonder-studio.image" -}}
{{- $tag := .Values.image.tag | default .Chart.AppVersion -}}
{{- if .Values.image.digest -}}
{{- printf "%s@%s" .Values.image.repository .Values.image.digest -}}
{{- else -}}
{{- printf "%s:%s" .Values.image.repository $tag -}}
{{- end -}}
{{- end }}

{{/*
Render the Gotenberg container image reference, supporting digest pinning.
*/}}
{{- define "cvwonder-studio.gotenbergImage" -}}
{{- if .Values.gotenberg.image.digest -}}
{{- printf "%s@%s" .Values.gotenberg.image.repository .Values.gotenberg.image.digest -}}
{{- else -}}
{{- printf "%s:%s" .Values.gotenberg.image.repository .Values.gotenberg.image.tag -}}
{{- end -}}
{{- end }}

{{/*
Resolve the internal Gotenberg service URL.
Used to auto-set GOTENBERG_URL in the Deployment when gotenberg.enabled=true.
*/}}
{{- define "cvwonder-studio.gotenbergUrl" -}}
{{- printf "http://%s-gotenberg:%d" (include "cvwonder-studio.fullname" .) (int .Values.gotenberg.service.port) -}}
{{- end }}

{{/*
Resolve the PostgreSQL hostname for the bundled sub-chart.
*/}}
{{- define "cvwonder-studio.postgresqlHost" -}}
{{- printf "%s-postgresql" (include "cvwonder-studio.fullname" .) -}}
{{- end }}

{{/*
Resolve the auto-composed DATABASE_URL when the postgresql sub-chart is enabled.
*/}}
{{- define "cvwonder-studio.postgresqlUrl" -}}
{{- printf "postgres://%s:%s@%s:5432/%s?sslmode=disable" .Values.postgresql.auth.username .Values.postgresql.auth.password (include "cvwonder-studio.postgresqlHost" .) .Values.postgresql.auth.database -}}
{{- end }}

{{/*
Render pod anti-affinity rules from the podAntiAffinity convenience helper.
Set podAntiAffinity to "soft" (preferred) or "hard" (required). Leave empty to disable.
*/}}
{{- define "cvwonder-studio.podAntiAffinity" -}}
{{- if eq .Values.podAntiAffinity "hard" }}
podAntiAffinity:
  requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchLabels:
          {{- include "cvwonder-studio.selectorLabels" . | nindent 10 }}
      topologyKey: {{ .Values.podAntiAffinityTopologyKey }}
{{- else if eq .Values.podAntiAffinity "soft" }}
podAntiAffinity:
  preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchLabels:
            {{- include "cvwonder-studio.selectorLabels" . | nindent 12 }}
        topologyKey: {{ .Values.podAntiAffinityTopologyKey }}
{{- end }}
{{- end }}

{{/*
Render the sessions volume definition (PVC, existingClaim, or emptyDir).
*/}}
{{- define "cvwonder-studio.sessionsVolume" -}}
{{- if .Values.storage.sessions.existingClaim }}
- name: sessions
  persistentVolumeClaim:
    claimName: {{ .Values.storage.sessions.existingClaim }}
{{- else if .Values.storage.sessions.enabled }}
- name: sessions
  persistentVolumeClaim:
    claimName: {{ include "cvwonder-studio.fullname" . }}-sessions
{{- else }}
- name: sessions
  emptyDir: {}
{{- end }}
{{- end }}

{{/*
Render the themes volume definition (PVC, existingClaim, or emptyDir).
*/}}
{{- define "cvwonder-studio.themesVolume" -}}
{{- if .Values.storage.themes.existingClaim }}
- name: themes
  persistentVolumeClaim:
    claimName: {{ .Values.storage.themes.existingClaim }}
{{- else if .Values.storage.themes.enabled }}
- name: themes
  persistentVolumeClaim:
    claimName: {{ include "cvwonder-studio.fullname" . }}-themes
{{- else }}
- name: themes
  emptyDir: {}
{{- end }}
{{- end }}
