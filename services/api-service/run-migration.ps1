# PowerShell script to run calendar and notification tables migration
# Requires PostgreSQL to be installed and running

Write-Host "Running calendar and notification tables migration..." -ForegroundColor Green

# Database configuration - try to get from .env or use defaults
$DB_NAME = "video_call_db"
$DB_USER = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"

# Try to read from .env file if exists
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    foreach ($line in $envContent) {
        if ($line -match "^DATABASE_URL=postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)$") {
            $DB_USER = $matches[1]
            $DB_HOST = $matches[3]
            $DB_PORT = $matches[4]
            $DB_NAME = $matches[5]
            break
        } elseif ($line -match "^DATABASE_URL=postgresql://([^@]+)@([^:]+):(\d+)/(.+)$") {
            $DB_USER = $matches[1]
            $DB_HOST = $matches[2]
            $DB_PORT = $matches[3]
            $DB_NAME = $matches[4]
            break
        }
    }
}

Write-Host "Database: $DB_NAME" -ForegroundColor Cyan
Write-Host "User: $DB_USER" -ForegroundColor Cyan
Write-Host "Host: $DB_HOST`:$DB_PORT" -ForegroundColor Cyan

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "ERROR: psql command not found. Please install PostgreSQL and add it to PATH." -ForegroundColor Red
    exit 1
}

Write-Host "`nRunning migration script..." -ForegroundColor Yellow
$migrationFile = Join-Path $PSScriptRoot "src\db\migrations\add_calendar_tables.sql"
if (Test-Path $migrationFile) {
    $env:PGPASSWORD = Read-Host "Enter PostgreSQL password for user '$DB_USER' (or press Enter if no password)" -AsSecureString
    if ($env:PGPASSWORD) {
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($env:PGPASSWORD)
        $env:PGPASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    }
    
    psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f $migrationFile
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Migration applied successfully!" -ForegroundColor Green
    } else {
        Write-Host "`nERROR: Failed to apply migration" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ERROR: Migration file not found at $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "`nMigration completed!" -ForegroundColor Green
