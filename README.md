# Full-Stack Application Deployment with Terraform, Amazon ECS, and CI/CD

## Overview
This project demonstrates building and deploying the **T2S Courses** app using a full-stack architecture with Terraform for infrastructure provisioning, Amazon ECS for container orchestration, and CI/CD pipelines for automated deployment. 

The application includes:
- **Front-End**: A React-based course catalog.
- **Back-End**: A Node.js/Express.js API for serving course data.

---

## Architecture
The architecture includes:
- **Front-End**: React application served via Amazon S3 and CloudFront.
- **Back-End**: Node.js/Express.js API running in Amazon ECS.
- **Database**: Amazon RDS or DynamoDB.
- **CI/CD**: GitHub Actions or AWS CodePipeline for automation.
- **Monitoring**: Amazon CloudWatch for metrics and logs.

---

## Features of T2S Courses App

### **Front-End**:
- Display a list of courses.
- Search and filter courses.
- View course details.

### **Back-End**:
- API endpoint to fetch courses (`/api/courses`).
- API endpoint to fetch course details by ID (`/api/courses/:id`).

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

## Step 1: Clone the Repositories

```bash
git clone https://github.com/Here2ServeU/aws-FullStackApp-terraform/

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

## Step 2: Dockerize Your Application

### 2.1. Front-End

Navigate to the front-end directory:
```bash
cd t2s-courses-frontend
```

Build the Docker image: 
```bash
docker build -t t2s-courses-frontend .
```

### 2.2. Back-End

Navigate to the back-end directory:
```bash
cd t2s-courses-backend
```

Build the Docker image:
```bash
docker build -t t2s-courses-backend .
```

### 2.3. Push Docker Images to Amazon ECR

Authenticate with Amazon ECR:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ecr_repository_uri>
```

Push the images: 
**Front-End**
```bash
docker tag t2s-courses-frontend:latest <ecr_repository_uri>/t2s-courses-frontend:latest
docker push <ecr_repository_uri>/t2s-courses-frontend:latest
```

**Back-End**
```bash
docker tag t2s-courses-backend:latest <ecr_repository_uri>/t2s-courses-backend:latest
docker push <ecr_repository_uri>/t2s-courses-backend:latest
```

## Step 3: Infrastructure Deployment with Terraform

### Define Environment Variables

Use environment-specific configurations in terraform.tfvars files:
**dev.tfvars**:

```hcl
environment       = "dev"
region            = "us-east-1"
vpc_cidr          = "10.0.0.0/16"
ecs_cluster_name  = "dev-cluster"
```

**prod.tfvars**:
```hcl
environment       = "prod"
region            = "us-east-1"
vpc_cidr          = "10.1.0.0/16"
ecs_cluster_name  = "prod-cluster"
```

### Deploy the Infrastructure
```bash
terraform init  # To initialize Terraform
terraform plan -var-file="dev.tfvars"  # To plan the infrastructure
terraform apply -var-file="dev.tfvars"  # To apply the infrastructure
```


## Step 4: CI/CD Pipeline with GitHub Actions

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

## Step 5: Configure Task Definitions with Environment Variables

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

## Step 6: Monitoring and Environment-Specific Metrics

Configure CloudWatch dashboards and alarms per environment to track metrics.
	
1.	Create Dashboards per Environment:
- Use tags or naming conventions like prod-backend or dev-backend for services.
	
2.	Set Environment-Specific Alarms:
- Example: CPU utilization > 80% triggers scale-out for the dev or prod cluster.

**Benefits of Using Variables and Environments**
- **Flexibility**: Easily switch between environments without changing code.
- **Scalability**: Separate environments for isolated testing and production.
- **Automation**: Fully automated deployments with environment-specific configurations.
- **Consistency**: Enforce standards and reduce errors by reusing configurations.

## Step 7: Clean Up

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
This guide demonstrates deploying the T2S Courses app as a full-stack application using Terraform, Amazon ECS, and CI/CD pipelines. The fully automated, scalable, and environment-specific infrastructure ensures reliable deployments across development and production environments.


