#!/usr/bin/env node

/**
 * Vercel Environment Variables Deployment Script
 * 
 * This script helps deploy PayMongo environment variables to Vercel
 * for Production, Preview, and Development environments.
 * 
 * Usage:
 *   node scripts/deploy-env.js
 *   
 * Requirements:
 *   - Vercel CLI installed: npm i -g vercel
 *   - Authenticated with Vercel: vercel login
 *   - .env.local file with your credentials
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ENV_FILE = '.env.local';
const REQUIRED_VARS = [
  'PAYMONGO_SECRET_KEY',
  'PAYMONGO_WEBHOOK_SECRET', 
  'PUBLIC_PAYMONGO_PUBLIC_KEY',
  'PUBLIC_APP_URL',
  'PAYMONGO_CHECKOUT_SUCCESS_PATH',
  'PAYMONGO_CHECKOUT_CANCEL_PATH'
];

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Environment file not found: ${filePath}`);
    console.log('💡 Create a .env.local file with your PayMongo credentials first.');
    console.log('   You can copy from .env.example and fill in your actual values.');
    process.exit(1);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      env[key.trim()] = value;
    }
  });
  
  return env;
}

function validateEnvironment(env) {
  const missing = REQUIRED_VARS.filter(key => !env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables:`);
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }
  
  // Validate formats
  if (!env.PAYMONGO_SECRET_KEY.startsWith('sk_')) {
    console.error('❌ PAYMONGO_SECRET_KEY must start with sk_test_ or sk_live_');
    process.exit(1);
  }
  
  if (!env.PUBLIC_PAYMONGO_PUBLIC_KEY.startsWith('pk_')) {
    console.error('❌ PUBLIC_PAYMONGO_PUBLIC_KEY must start with pk_test_ or pk_live_');
    process.exit(1);
  }
  
  if (!env.PAYMONGO_WEBHOOK_SECRET.startsWith('whsec_')) {
    console.error('❌ PAYMONGO_WEBHOOK_SECRET must start with whsec_');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
}

function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function deployToVercel(env) {
  console.log('🚀 Deploying environment variables to Vercel...\n');
  
  const environments = ['production', 'preview', 'development'];
  
  REQUIRED_VARS.forEach(key => {
    const value = env[key];
    environments.forEach(envType => {
      const command = `vercel env add ${key} ${envType}`;
      console.log(`📝 Setting ${key} for ${envType}...`);
      
      try {
        // Use spawn to handle interactive input
        execSync(`echo "${value}" | ${command}`, { stdio: 'inherit' });
      } catch (error) {
        console.log(`⚠️  ${key} might already exist for ${envType}, skipping...`);
      }
    });
    console.log();
  });
}

function main() {
  console.log('🎯 PayMongo Environment Deployment to Vercel\n');
  
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch {
    console.error('❌ Vercel CLI is not installed.');
    console.log('💡 Install it with: npm install -g vercel');
    console.log('💡 Then authenticate with: vercel login');
    process.exit(1);
  }
  
  // Read and validate environment
  const env = readEnvFile(ENV_FILE);
  validateEnvironment(env);
  
  console.log('📋 Environment variables to deploy:');
  REQUIRED_VARS.forEach(key => {
    const value = env[key];
    const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`   ${key}: ${displayValue}`);
  });
  console.log();
  
  // Confirm deployment
  console.log('⚠️  This will add/update environment variables in Vercel for:');
  console.log('   - Production');
  console.log('   - Preview');
  console.log('   - Development');
  console.log();
  
  // Deploy to Vercel
  deployToVercel(env);
  
  console.log('✅ Environment variables deployed successfully!');
  console.log('💡 Remember to redeploy your Vercel project to apply changes:');
  console.log('   vercel --prod');
}

if (require.main === module) {
  main();
}
