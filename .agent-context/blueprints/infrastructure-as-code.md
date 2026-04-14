# Infrastructure as Code (IaC) Blueprint

> ClickOps is a sin. If it's not in code, it doesn't exist. Treats your servers like cattle, not pets.

## 1. Tooling (March 2026)
- **Standard:** Terraform / OpenTofu (HCL) or Pulumi (TypeScript/Go/Python).
- **BANNED:** AWS CloudFormation (verbose, slow, vendor-locked) unless mandated by enterprise policy. AWS CDK is acceptable but requires rigorous linting to prevent runaway loops.

## 2. Directory Structure (Blast Radius Management)
Never put all your infrastructure into a single `main.tf` or a single state file.
- **BANNED:** Flat structure. A single mistake could destroy the database while updating an S3 bucket.
- **REQUIRED (Component/Environment Split):**
  ```
  infrastructure/
    modules/
      vpc/
      rds/
      eks/
    environments/
      dev/
        vpc/    (depends on modules/vpc)
        rds/    (runs its own state file)
      prod/
        vpc/
        rds/
  ```

## 3. Remote State & Locking
State files contain sensitive data (passwords, IP addresses) and represent the source of truth for your physical architecture.
- **Rule:** ALWAYS use a remote backend (S3, GCS, HCP Terraform) with state locking (DynamoDB, native GCS/HCP).
- **BANNED:** Committing `terraform.tfstate` or `Pulumi.dev.yaml` to Git. Ensure `*.tfstate` is in `.gitignore`.

## 4. Hardcoded Values & Secrets
- **Rule:** NEVER hardcode ARNs, IPs, or passwords in your IaC.
- **REQUIRED:** Pass variables via `.tfvars` (which are gitignored) or environment variables (`TF_VAR_db_password`). Use a Secret Manager (AWS Secrets Manager, HashiCorp Vault) and reference the secret dynamically.
- **Example:**
  ```hcl
  # ❌ BANNED
  password = "SuperSecretPassword123!"

  # ✅ REQUIRED
  data "aws_secretsmanager_secret_version" "db" {
    secret_id = aws_secretsmanager_secret.db.id
  }
  password = jsondecode(data.aws_secretsmanager_secret_version.db.secret_string)["password"]
  ```

## 5. Principle of Least Privilege (IAM)
- **Rule:** Wildcards (`*`) in IAM policies are strictly banned unless absolutely necessary (e.g., specific S3 actions).
- **BANNED:** Assigning `AmazonS3FullAccess` to a worker node that only needs to read from one bucket.
- **REQUIRED:** Explicit resource ARNs and explicit Actions.
  ```hcl
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["arn:aws:s3:::my-specific-bucket/uploads/*"]
  }
  ```

## 6. Immutable Infrastructure
- **Rule:** If a server is unhealthy, terminate it. Do not SSH into it to fix it.
- **Rule:** Use Auto Scaling Groups (ASGs) even if the desired capacity is 1. This ensures the component is self-healing.
