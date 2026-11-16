<#
.SYNOPSIS
  Loads the demo data set (src/main/resources/db/seed/demo-seed.sql) into the LOCAL database.

.DESCRIPTION
  Reads the same environment variables as the application:
    DB_URL       optional, default jdbc:postgresql://localhost:5432/p02_training
    DB_USERNAME  optional, default postgres
    DB_PASSWORD  required
  The schema must already exist (start the application once so Flyway applies V1).
  Safe to run again: it resets the demo data to today's dates (see the header of demo-seed.sql).

.EXAMPLE
  $env:DB_PASSWORD = '...'; .\scripts\seed-demo.ps1
#>
[CmdletBinding()]
param(
    # Optional path to psql.exe when it is not on PATH or in the default PostgreSQL folder.
    [string]$Psql
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$seedFile = Join-Path $root 'src\main\resources\db\seed\demo-seed.sql'
if (-not (Test-Path $seedFile)) { throw "Seed file not found: $seedFile" }

$url = if ($env:DB_URL) { $env:DB_URL } else { 'jdbc:postgresql://localhost:5432/p02_training' }
$user = if ($env:DB_USERNAME) { $env:DB_USERNAME } else { 'postgres' }
if (-not $env:DB_PASSWORD) { throw 'DB_PASSWORD is not set.' }

# jdbc:postgresql://host[:port]/database[?params]
if ($url -notmatch '^jdbc:postgresql://(?<host>[^:/?]+)(:(?<port>\d+))?/(?<db>[^?]+)') {
    throw "DB_URL is not a jdbc:postgresql URL: $url"
}
$dbHost = $Matches['host']
$dbPort = if ($Matches['port']) { $Matches['port'] } else { '5432' }
$dbName = $Matches['db']

if (-not $Psql) {
    $cmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($cmd) {
        $Psql = $cmd.Source
    } else {
        $Psql = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\psql.exe' -ErrorAction SilentlyContinue |
            Sort-Object { [int]($_.Directory.Parent.Name -replace '\D', '') } -Descending |
            Select-Object -First 1 -ExpandProperty FullName
    }
}
if (-not $Psql -or -not (Test-Path $Psql)) {
    throw 'psql not found. Add PostgreSQL\bin to PATH or pass -Psql "C:\Program Files\PostgreSQL\18\bin\psql.exe".'
}

Write-Host "Seeding demo data into $dbName on ${dbHost}:$dbPort as $user ..."
$env:PGPASSWORD = $env:DB_PASSWORD
$env:PGCLIENTENCODING = 'UTF8'
try {
    & $Psql -X -q -v ON_ERROR_STOP=1 -h $dbHost -p $dbPort -U $user -d $dbName -f $seedFile
    $code = $LASTEXITCODE
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
if ($code -ne 0) {
    Write-Error "Demo seed failed (psql exit code $code). Nothing was changed."
    exit $code
}
Write-Host 'Done. Demo accounts: admin, admin2, manager, gv01-gv05, sv01-sv30 / Demo@123'
