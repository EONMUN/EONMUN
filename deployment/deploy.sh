#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAMESPACE="eonmun-eonmun-prod"

echo "🚀 Deploying EONMUN to namespace: $NAMESPACE"

# Check if namespace exists, create if not
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    echo "📦 Creating namespace: $NAMESPACE"
    kubectl create namespace "$NAMESPACE"
else
    echo "✅ Namespace $NAMESPACE already exists"
fi

# Deploy secrets if the file exists (local development)
if [ -f "$SCRIPT_DIR/secrets.yaml" ]; then
    echo "🔑 Applying secrets from secrets.yaml"
    kubectl apply -f "$SCRIPT_DIR/secrets.yaml"
else
    echo "⚠️  secrets.yaml not found - skipping secret deployment (expected in CI/CD)"
fi

# Apply main manifests
echo "📋 Applying main manifests"
kubectl apply -f "$SCRIPT_DIR/manifest.yaml"

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/eonmun-strapi-deployment -n "$NAMESPACE" --timeout=300s

echo "✅ Deployment complete!"

# Show status
echo ""
echo "📊 Current status:"
kubectl get pods,svc,ingress -n "$NAMESPACE" -l app=strapi