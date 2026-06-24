param(
  [string]$EnvPath = "C:\Users\MarcHenryCruz\Desktop\Projects\ai-registry\.env.supabase-write",
  [string]$SqlPath = "C:\Users\MarcHenryCruz\Desktop\Projects\ai-registry\supabase\imports\import-public-data.sql"
)

$ErrorActionPreference = "Stop"

function Read-EnvValue {
  param([string[]]$Lines, [string]$Name)

  $line = $Lines | Where-Object { $_ -match "^$Name=" } | Select-Object -First 1
  if (-not $line) {
    throw "Missing $Name in $EnvPath"
  }

  return (($line -replace "^$Name=", "").Trim() -replace '^"', '' -replace '"$', '')
}

$envLines = Get-Content $EnvPath
$dbUrl = Read-EnvValue $envLines "SUPABASE_DB_URL"

if ($dbUrl -eq "paste-your-supabase-pooler-or-direct-postgres-connection-string-here") {
  throw "SUPABASE_DB_URL still has the placeholder value."
}

node_modules\.bin\supabase.cmd db query --db-url $dbUrl --file $SqlPath
