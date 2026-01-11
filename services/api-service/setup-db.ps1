# PowerShell script to setup database
# Requires PostgreSQL to be installed and running

Write-Host "Setting up PostgreSQL database for Video Call project..." -ForegroundColor Green

# Database configuration
$DB_NAME = "video_call_db"
$DB_USER = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "ERROR: psql command not found. Please install PostgreSQL and add it to PATH." -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 1: Creating database..." -ForegroundColor Yellow
$createDbCmd = "CREATE DATABASE $DB_NAME;"
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c $createDbCmd 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database created successfully" -ForegroundColor Green
} else {
    Write-Host "Database might already exist, continuing..." -ForegroundColor Yellow
}

Write-Host "`nStep 2: Running schema..." -ForegroundColor Yellow
$schemaFile = Join-Path $PSScriptRoot "src\db\schema.sql"
if (Test-Path $schemaFile) {
    psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f $schemaFile
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Schema applied successfully" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to apply schema" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ERROR: Schema file not found at $schemaFile" -ForegroundColor Red
    exit 1
}

Write-Host "`n✓ Database setup completed!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Update DATABASE_URL in .env file:" -ForegroundColor White
Write-Host "   DATABASE_URL=postgresql://$DB_USER@$DB_HOST`:$DB_PORT/$DB_NAME" -ForegroundColor Gray
Write-Host "2. Restart the backend server" -ForegroundColor White

