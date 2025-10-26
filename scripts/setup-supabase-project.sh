#!/bin/bash

# Script to generate project-specific Supabase docker-compose files
# Usage: ./setup-supabase-project.sh <project_name> [db_port] [api_port] [studio_port] [inbucket_port]

set -e

# Check if project name is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <project_name> [db_port] [api_port] [studio_port] [inbucket_port]"
    echo "Example: $0 myproject 5432 8000 3000 9000"
    exit 1
fi

PROJECT_NAME="$1"
DB_PORT="${2:-5432}"
API_PORT="${3:-8000}"
STUDIO_PORT="${4:-3000}"
INBUCKET_PORT="${5:-9000}"

# Validate project name (must be valid for Docker container names)
if [[ ! "$PROJECT_NAME" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]]; then
    echo "Error: Project name must start with a letter or number and contain only letters, numbers, underscores, periods, and hyphens."
    exit 1
fi

echo "Setting up Supabase project: $PROJECT_NAME"
echo "Ports - DB: $DB_PORT, API: $API_PORT, Studio: $STUDIO_PORT, Inbucket: $INBUCKET_PORT"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SUPABASE_DIR="$PROJECT_ROOT/supabase"

# Check if template file exists
TEMPLATE_FILE="$SUPABASE_DIR/docker-compose.override.template.yml"
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "Error: Template file not found at $TEMPLATE_FILE"
    exit 1
fi

# Create output file
OUTPUT_FILE="$SUPABASE_DIR/docker-compose.override.yml"

# Generate the docker-compose override file with project-specific settings
echo "Generating $OUTPUT_FILE..."

# Create a temporary file for processing
TMP_FILE=$(mktemp)

# Copy template and replace variables
sed "s/\${PROJECT_NAME}/$PROJECT_NAME/g" "$TEMPLATE_FILE" > "$TMP_FILE"

# Replace port variables
sed -i.bak "s/\${DB_PORT}/$DB_PORT/g" "$TMP_FILE"
sed -i.bak "s/\${API_PORT}/$API_PORT/g" "$TMP_FILE"
sed -i.bak "s/\${STUDIO_PORT}/$STUDIO_PORT/g" "$TMP_FILE"
sed -i.bak "s/\${INBUCKET_PORT}/$INBUCKET_PORT/g" "$TMP_FILE"

# Update volume names to be project-specific
sed -i.bak "s/supabase_db_data/supabase_db_${PROJECT_NAME}/g" "$TMP_FILE"
sed -i.bak "s/supabase_storage_data/supabase_storage_${PROJECT_NAME}/g" "$TMP_FILE"

# Move the processed file to the final location
mv "$TMP_FILE" "$OUTPUT_FILE"
rm -f "$TMP_FILE.bak"

echo "✅ Docker Compose override file generated successfully!"
echo "📁 File location: $OUTPUT_FILE"
echo ""
echo "🚀 To start your Supabase instance:"
echo "   cd $SUPABASE_DIR"
echo "   docker compose up -d"
echo ""
echo "🔗 Access URLs:"
echo "   - Studio: http://localhost:$STUDIO_PORT"
echo "   - API: http://localhost:$API_PORT"
echo "   - Database: localhost:$DB_PORT"
echo "   - Inbucket (Email): http://localhost:$INBUCKET_PORT"