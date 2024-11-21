# Full-Stack Application Deployment with Terraform, Amazon ECS, and CI/CD

## Overview
This project demonstrates how to build and deploy a scalable full-stack application using Terraform for infrastructure provisioning, Amazon ECS for container orchestration, and a CI/CD pipeline for automation. The setup includes environment-specific configurations to ensure flexibility and scalability.

---

## Architecture
The architecture includes:
- **Front-End**: React application served via Amazon S3 and CloudFront.
- **Back-End**: Node.js/Express.js API running in Amazon ECS.
- **Database**: Amazon RDS or DynamoDB.
- **CI/CD**: GitHub Actions or AWS CodePipeline for automation.
- **Monitoring**: Amazon CloudWatch for metrics and logs.

---

## Prerequisites
1. **AWS Account**: Ensure you have an active account.
2. **Terraform**: Install Terraform on your local machine.
3. **Docker**: Install Docker for containerization.
4. **AWS CLI**: Install and configure the AWS CLI.
5. **GitHub Repository**: Use GitHub to store application code and workflows.

---

## Project Structure
### Terraform Modules
- **`modules/vpc`**: Configures VPC, subnets, and route tables.
- **`modules/ecs`**: Creates ECS clusters and services.
- **`modules/alb`**: Provisions Application Load Balancer and target groups.
- **`modules/rds`**: Configures RDS databases (optional).
- **`modules/iam`**: Defines IAM roles and policies.

---

## 1. Organizing Variables in Terraform

### 1.1 Define Variables in variables.tf
Define variables in `variables.tf`:
```hcl
variable "environment" {
  description = "Environment name (dev, stage, prod)"
  type        = string
}

variable "region" {
  description = "AWS region to deploy the infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "db_user" {
  description = "Database username"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}
```

### 1.2. Define Environment-Specific Variables in terraform.tfvars

Create separate terraform.tfvars files for each environment.

**dev.tfvars**
```hcl
environment       = "dev"
region            = "us-east-1"
vpc_cidr          = "10.0.0.0/16"
ecs_cluster_name  = "dev-cluster"
db_user           = "dev_user"
db_password       = "dev_password"
```

**prod.tfvars**
```hcl
environment       = "prod"
region            = "us-east-1"
vpc_cidr          = "10.1.0.0/16"
ecs_cluster_name  = "prod-cluster"
db_user           = "prod_user"
db_password       = "prod_password"
```

### 1.3. Use Variables in Terraform Configuration

Replace hardcoded values with variables on the **main.tf**. 

```hcl
provider "aws" {
  region = var.region
}

module "vpc" {
  source  = "./modules/vpc"
  cidr    = var.vpc_cidr
  environment = var.environment
}

module "ecs" {
  source       = "./modules/ecs"
  cluster_name = var.ecs_cluster_name
  vpc_id       = module.vpc.vpc_id
  subnets      = module.vpc.public_subnets
}

module "rds" {
  source      = "./modules/rds"
  db_user     = var.db_user
  db_password = var.db_password
}
```

### 1.4. Apply Terraform for Each Environment

Specify the environment file using -var-file during deployment.

**For Dev Environment:**
```bash
terraform init
terraform plan -var-file="dev.tfvars"
terraform apply -var-file="dev.tfvars"
```

**For Prod Environment**
```bash
terraform init
terraform plan -var-file="prod.tfvars"
terraform apply -var-file="prod.tfvars"
```

## 2. CI/CD with Environment Variables

### 2.1. Parameterize CI/CD Workflows

Pass environment variables in the CI/CD pipeline to support multiple environments.

**GitHub Actions Workflow:**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
      - dev

env:
  AWS_REGION: us-east-1
  ENVIRONMENT: ${{ github.ref_name }} # Maps branch to environment

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: Set Environment Variables
      run: |
        echo "AWS_REGION=${{ env.AWS_REGION }}" >> $GITHUB_ENV
        echo "ENVIRONMENT=${{ env.ENVIRONMENT }}" >> $GITHUB_ENV

    - name: Build and Push Frontend Image
      run: |
        docker build -t <ecr_repository_uri>/${{ env.ENVIRONMENT }}/frontend:latest ./frontend
        docker push <ecr_repository_uri>/${{ env.ENVIRONMENT }}/frontend:latest

    - name: Build and Push Backend Image
      run: |
        docker build -t <ecr_repository_uri>/${{ env.ENVIRONMENT }}/backend:latest ./backend
        docker push <ecr_repository_uri>/${{ env.ENVIRONMENT }}/backend:latest

  deploy:
    runs-on: ubuntu-latest
    needs: build
    steps:
    - name: Deploy ECS Services
      run: |
        aws ecs update-service --cluster ${{ env.ENVIRONMENT }}-cluster \
          --service backend-service \
          --force-new-deployment
        aws ecs update-service --cluster ${{ env.ENVIRONMENT }}-cluster \
          --service frontend-service \
          --force-new-deployment
```

### 2.2. Configure Task Definitions with Environment Variables

Use ECS task definition templates for environment-specific variables.

**ECS Task Definition Template:**
```json
{
  "family": "backend-service",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<ecr_repository_uri>/{{ENVIRONMENT}}/backend:latest",
      "environment": [
        { "name": "DB_USER", "value": "{{DB_USER}}" },
        { "name": "DB_PASSWORD", "value": "{{DB_PASSWORD}}" },
        { "name": "ENVIRONMENT", "value": "{{ENVIRONMENT}}" }
      ],
      "memory": 512,
      "cpu": 256
    }
  ]
}
```

Use Terraform or AWS CLI to update task definitions dynamically based on variables.

## 3. Monitoring and Environment-Specific Metrics

Configure CloudWatch dashboards and alarms per environment to track metrics.
	
1.	Create Dashboards per Environment:
- Use tags or naming conventions like prod-backend or dev-backend for services.
	
2.	Set Environment-Specific Alarms:
- Example: CPU utilization > 80% triggers scale-out for the dev or prod cluster.

## 4. Benefits of Using Variables and Environments
- **Flexibility**: Easily switch between environments without changing code.
- **Scalability**: Separate environments for isolated testing and production.
- **Automation**: Fully automated deployments with environment-specific configurations.
- **Consistency**: Enforce standards and reduce errors by reusing configurations.

## Clean Up

To remove resources and avoid incurring charges:
- Destroy Terraform-managed resources:
```bash
terraform destroy -var-file="dev.tfvars"
terraform destroy -var-file="prod.tfvars"
```

Delete Docker images from Amazon ECR:
```bash
aws ecr batch-delete-image --repository-name frontend --image-ids imageTag=latest
aws ecr batch-delete-image --repository-name backend --image-ids imageTag=latest
```

Remove CloudWatch Logs and alarms manually if not managed by Terraform.

---
This project demonstrates a robust, scalable, and automated workflow for deploying a full-stack application using Terraform, Amazon ECS, and CI/CD pipelines. The use of variables and environments ensures flexibility and consistency across multiple stages of development.

Feel free to contribute or customize based on your project requirements.


