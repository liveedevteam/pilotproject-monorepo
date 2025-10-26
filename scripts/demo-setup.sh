#!/bin/bash

# Demo script showing multi-project setup
# This demonstrates how to set up multiple projects with isolated Supabase instances

echo "🚀 Supabase Multi-Project Demo Setup"
echo "===================================="

# Function to print colored output
print_step() {
    echo -e "\n\033[1;34m➤ $1\033[0m"
}

print_success() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_info() {
    echo -e "\033[1;33mℹ️  $1\033[0m"
}

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is required but not installed. Please install pnpm first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

print_step "Setting up demo project: 'ecommerce-app'"
pnpm setup:project ecommerce-app

print_success "Project setup complete!"

print_info "Generated configuration:"
if [ -f "supabase.config.json" ]; then
    cat supabase.config.json | head -20
fi

print_step "Starting Supabase services..."
pnpm supabase:start

print_success "Supabase services started!"

print_step "Checking service status..."
pnpm supabase:status

print_info "Your services are now running at:"
echo "🌐 API: Check supabase.config.json for the apiUrl"
echo "🎛️  Studio: Check supabase.config.json for the studioUrl"  
echo "📧 Inbucket: Check supabase.config.json for the inbucketUrl"
echo "🗄️  Database: Check supabase.config.json for the databaseUrl"

print_step "Next steps:"
echo "1. Run 'pnpm db:push' to initialize your database schema"
echo "2. Run 'pnpm dev' to start your development server"
echo "3. To setup another project, clone this repo to a different directory"
echo "4. Run 'pnpm setup:project <different-name>' in the new directory"

print_info "To stop services: pnpm supabase:stop"
print_info "To reset database: pnpm supabase:reset"

echo -e "\n🎉 Demo setup complete! Happy coding!"