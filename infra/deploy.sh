#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo "  FLOODSHIELD — AWS AP-SOUTH-1 DEPLOYMENT SCRIPT"
echo "=========================================================="
echo "  Notice on AWS Billing & Potentially Chargeable Resources:"
echo "  • AWS Lambda: Serverless ARM64 (Node.js 22), 1M free requests/mo"
echo "  • Amazon API Gateway: HTTP API, 1M free requests/mo (Free Tier)"
echo "  • Amazon CloudWatch Logs: 5 GB log ingestion included in Free Tier"
echo "  • Amazon S3: Deployment bucket artifacts (Free Tier eligible)"
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

# 3. Check SAM CLI
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v sam &> /dev/null; then
    echo "❌ Error: AWS SAM CLI is required for automated deployment."
    echo "Install via Homebrew: brew install aws-sam-cli"
    exit 1
fi

echo "🚀 Building SAM application with Node.js 22 runtime..."
sam build -t template.yaml

echo "🚀 Deploying CloudFormation stack: $STACK_NAME in $REGION..."
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

if [ -z "$API_URL" ] || [ "$API_URL" = "None" ]; then
    echo "❌ Error: Could not retrieve ApiEndpoint from stack outputs."
    exit 1
fi

echo "📡 Deployed API Gateway URL: $API_URL"
echo "🔍 Running Post-Deployment Verification Smoke Tests..."

# Test 1: GET /health
echo "   Testing GET $API_URL/health..."
HEALTH_RESPONSE=$(curl -fsSL --max-time 10 "$API_URL/health")
if ! echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "❌ Health check failed. Received: $HEALTH_RESPONSE"
    exit 1
fi
echo "   ✅ Health check passed: $HEALTH_RESPONSE"

# Test 2: POST /assess
echo "   Testing POST $API_URL/assess..."
TEST_PAYLOAD='{"location":{"id":"milan-subway","name":"Milan Subway, Santacruz","elevationMeters":3.8,"depressionIndex":10,"proximityToWaterwayMeters":1600,"imperviousRatio":0.95},"params":{"rainfallMmPerHour":40,"durationHours":2,"tideLevel":"MID_TIDE","drainageCondition":"STANDARD"}}'
ASSESS_RESPONSE=$(curl -fsSL -X POST -H "Content-Type: application/json" -d "$TEST_PAYLOAD" --max-time 10 "$API_URL/assess")
if ! echo "$ASSESS_RESPONSE" | grep -q '"AWS_LAMBDA"'; then
    echo "❌ Assessment endpoint verification failed. Received: $ASSESS_RESPONSE"
    exit 1
fi
echo "   ✅ Assessment check passed with verified AWS_LAMBDA provenance."

echo "=========================================================="
echo "🎉 DEPLOYMENT AND POST-VERIFICATION SUCCESSFUL!"
echo "   API Gateway URL: $API_URL"
echo "   Configure Frontend (.env):"
echo "     echo \"VITE_AWS_API_URL=$API_URL\" > \"$SCRIPT_DIR/../.env\""
echo "=========================================================="

