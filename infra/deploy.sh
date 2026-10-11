#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  FLOODSHIELD — AWS AP-SOUTH-1 DEPLOYMENT SCRIPT"
echo "=========================================================="

REGION="${AWS_REGION:-ap-south-1}"
STACK_NAME="${FLOODSHIELD_STACK:-floodshield-monsoon-stack}"

# 1. Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed or not in PATH."
    echo "To deploy to AWS, install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# 2. Check AWS Credentials
echo "🔍 Verifying AWS caller identity in region: $REGION..."
if ! aws sts get-caller-identity --region "$REGION" > /dev/null 2>&1; then
    echo "❌ Error: AWS credentials not found or invalid."
    echo "Please configure credentials by running:"
    echo "  export AWS_ACCESS_KEY_ID=your_access_key"
    echo "  export AWS_SECRET_ACCESS_KEY=your_secret_key"
    echo "  export AWS_REGION=ap-south-1"
    echo "or run: aws configure"
    exit 1
fi

echo "✅ AWS credentials verified successfully."
CALLER_ARN=$(aws sts get-caller-identity --query "Arn" --output text)
echo "   Principal: $CALLER_ARN"

# 3. Check SAM CLI or CloudFormation
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if command -v sam &> /dev/null; then
    echo "🚀 Deploying with AWS SAM in $REGION..."
    sam build -t template.yaml
    sam deploy \
      --stack-name "$STACK_NAME" \
      --region "$REGION" \
      --capabilities CAPABILITY_IAM \
      --resolve-s3 \
      --no-confirm-changeset

    API_URL=$(aws cloudformation describe-stacks \
      --stack-name "$STACK_NAME" \
      --region "$REGION" \
      --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
      --output text)

    echo "=========================================================="
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "   API Gateway URL: $API_URL"
    echo "   Health Check:    curl $API_URL/health"
    echo "   Set frontend:   echo \"VITE_AWS_API_URL=$API_URL\" > ../.env"
    echo "=========================================================="
else
    echo "⚠️  AWS SAM CLI not found. Packaging Lambda function bundle..."
    DIST_DIR="$SCRIPT_DIR/../dist-lambda"
    mkdir -p "$DIST_DIR"
    cp -r "$SCRIPT_DIR/../backend/lambda/"* "$DIST_DIR/"
    cd "$DIST_DIR"
    zip -rq lambda.zip .
    echo "✅ Lambda bundle packaged at $DIST_DIR/lambda.zip"
    echo "To deploy via SAM, install SAM CLI: brew install aws-sam-cli"
    echo "Or deploy via CloudFormation / AWS Console."
fi
