#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  FLOODSHIELD — AWS AP-SOUTH-1 DEPLOYMENT SCRIPT"
echo "=========================================================="

REGION="ap-south-1"
STACK_NAME="floodshield-monsoon-stack"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed. Please install awscli or configure credentials."
    exit 1
fi

# Check AWS Identity
echo "Verifying AWS credentials in $REGION..."
aws sts get-caller-identity --region $REGION

# Check SAM CLI
if command -v sam &> /dev/null; then
    echo "Deploying via AWS SAM..."
    cd "$(dirname "$0")"
    sam build -t template.yaml
    sam deploy --stack-name $STACK_NAME --region $REGION --capabilities CAPABILITY_IAM --resolve-s3
else
    echo "SAM CLI not found. Packaging and deploying with CloudFormation..."
    cd "$(dirname "$0")"
    # Create zip of lambda
    mkdir -p ../dist-lambda
    cp -r ../backend/lambda/* ../dist-lambda/
    cd ../dist-lambda
    zip -r lambda.zip .
    cd -
    
    echo "Lambda packaged successfully. Run 'sam deploy' when SAM CLI is available."
fi

echo "=========================================================="
echo "  Deployment Complete! Retrieve your API Gateway URL."
echo "=========================================================="
