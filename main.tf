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
