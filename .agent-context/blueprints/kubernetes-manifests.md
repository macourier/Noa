# Kubernetes Manifests Blueprint

> Kubernetes is a declarative state machine. Tell it what you want, not how to do it.

## 1. Bare Minimum Requirements
Every application deployed to Kubernetes MUST include at minimum:
1. `Deployment` (or `StatefulSet`/`DaemonSet`)
2. `Service`
3. `ConfigMap` (for non-sensitive config)
4. `Secret` (managed externally, e.g., via ExternalSecrets)
5. `Ingress` (or `Gateway APIRoute`)

## 2. Resource Limits & Requests (Mandatory)
A container without resource limits is a noisy neighbor that will eventually crash the node.
- **Rule:** EVERY container in a Pod MUST have BOTH `requests` and `limits` defined for CPU and Memory.
- **BANNED:** Omitting the `resources` block.
- **REQUIRED:**
  ```yaml
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "500m"
  ```

## 3. Liveness & Readiness Probes (Mandatory)
Kubernetes needs to know when your app is ready to serve traffic and if it needs to be restarted.
- **Rule:** EVERY container MUST define a `readinessProbe` and a `livenessProbe`.
- **BANNED:** Assuming the container is ready just because the process started.
- **REQUIRED:**
  ```yaml
  livenessProbe:
    httpGet:
      path: /healthz
      port: 8080
    initialDelaySeconds: 5
    periodSeconds: 10
  readinessProbe:
    httpGet:
      path: /ready
      port: 8080
    initialDelaySeconds: 5
    periodSeconds: 5
  ```

## 4. The `latest` Tag Fallacy
- **Rule:** NEVER use the `:latest` tag for container images in production.
- **Why:** Deployments containing the `latest` tag cannot be easily rolled back, and nodes may cache different versions of `latest`.
- **REQUIRED:** Use explicit semantic versioning (`:v1.2.3`) or Git SHA hashes (`:sha-7a8f9b`).

## 5. Configuration & Secrets Management
- **Rule:** Application configuration must be injected via Environment Variables originating from `ConfigMaps` or `Secrets`.
- **BANNED:** Hardcoding environment variables in the `Deployment` manifest.
- **BANNED:** Storing Base64-encoded `Secret` manifests in version control.
- **REQUIRED:** Use tools like `External Secrets Operator` to pull secrets from AWS Secrets Manager / HashiCorp Vault into the cluster securely.
  ```yaml
  envFrom:
    - configMapRef:
        name: app-config
    - secretRef:
        name: app-secrets
  ```

## 6. Security Context
By default, containers run as `root`. This is a massive security risk.
- **Rule:** Containers MUST run as a non-root user. The filesystem should be read-only where possible.
- **REQUIRED:**
  ```yaml
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    readOnlyRootFilesystem: true
    allowPrivilegeEscalation: false
  ```
