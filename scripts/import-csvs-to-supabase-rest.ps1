param(
  [string]$EnvPath = "C:\Users\MarcHenryCruz\Desktop\Projects\ai-registry\.env.supabase-write",
  [string]$ProfilesCsv = "C:\Users\MarcHenryCruz\Downloads\profiles-export-2026-06-10_13-47-56.csv",
  [string]$PartnerToolDetailsCsv = "C:\Users\MarcHenryCruz\Downloads\partner_tool_details-export-2026-06-10_13-47-34.csv",
  [string]$PartnersCsv = "C:\Users\MarcHenryCruz\Downloads\partners-export-2026-06-10_13-48-50.csv",
  [string]$UserRolesCsv = "C:\Users\MarcHenryCruz\Downloads\user_roles-export-2026-06-10_13-49-21.csv"
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

function Empty-To-Null {
  param([AllowNull()][string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $null
  }

  return $Value
}

function Int-Or-Default {
  param([AllowNull()][string]$Value, [int]$Default = 0)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $Default
  }

  return [int]$Value
}

function Bool-Or-Default {
  param([AllowNull()][string]$Value, [bool]$Default = $false)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $Default
  }

  return [System.Convert]::ToBoolean($Value)
}

function Json-Or-Null {
  param([AllowNull()][string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $null
  }

  return $Value | ConvertFrom-Json
}

function Invoke-Upsert {
  param(
    [string]$Table,
    [object[]]$Rows,
    [string]$BaseUrl,
    [hashtable]$Headers
  )

  if ($Rows.Count -eq 0) {
    Write-Host "${Table}: no rows"
    return
  }

  $json = $Rows | ConvertTo-Json -Depth 50
  $uri = "${BaseUrl}/rest/v1/${Table}?on_conflict=id"
  try {
    Invoke-RestMethod -Uri $uri -Method Post -Headers $Headers -Body $json | Out-Null
  } catch {
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
    throw "${Table}: import failed. $body"
  }
  Write-Host "${Table}: upserted $($Rows.Count) rows"
}

$userIdMap = @{
  "be0da6bb-1da6-4b7e-9c79-852d4dc63520" = "6a87e8f2-79ea-45bf-99d7-6793f170262c"
}

function Map-UserId {
  param([AllowNull()][string]$Value)

  $id = Empty-To-Null $Value
  if ($id -and $userIdMap.ContainsKey($id)) {
    return $userIdMap[$id]
  }

  return $id
}

$envLines = Get-Content $EnvPath
$supabaseUrl = Read-EnvValue $envLines "SUPABASE_URL"
$serviceRoleKey = Read-EnvValue $envLines "SUPABASE_SERVICE_ROLE_KEY"

if ($serviceRoleKey -eq "paste-your-service-role-key-here") {
  throw "SUPABASE_SERVICE_ROLE_KEY still has the placeholder value."
}

$headers = @{
  apikey = $serviceRoleKey
  Authorization = "Bearer $serviceRoleKey"
  "Content-Type" = "application/json"
  Prefer = "resolution=merge-duplicates,return=minimal"
}

$profiles = Import-Csv $ProfilesCsv -Delimiter ';' | ForEach-Object {
  [ordered]@{
    id = Map-UserId $_.id
    display_name = Empty-To-Null $_.display_name
    created_at = Empty-To-Null $_.created_at
    office = Empty-To-Null $_.office
    position = Empty-To-Null $_.position
    avatar_url = Empty-To-Null $_.avatar_url
    email = Empty-To-Null $_.email
  }
}

$partners = Import-Csv $PartnersCsv -Delimiter ';' | ForEach-Object {
  $partnerEmail = Empty-To-Null $_.owner_email
  if (-not $partnerEmail) {
    $partnerEmail = Empty-To-Null $_.contact_email
  }
  if (-not $partnerEmail) {
    $partnerEmail = "$($_.key)@import.local"
  }

  [ordered]@{
    id = Empty-To-Null $_.id
    key = Empty-To-Null $_.key
    name = Empty-To-Null $_.name
    email = $partnerEmail
    description = Empty-To-Null $_.description
    tool_count = Int-Or-Default $_.tool_count
    status = Empty-To-Null $_.status
    created_at = Empty-To-Null $_.created_at
    tools = Empty-To-Null $_.tools
    theme_config = Json-Or-Null $_.theme_config
    proposed_by = Map-UserId $_.proposed_by
    owner_email = Empty-To-Null $_.owner_email
    logo_svg = Empty-To-Null $_.logo_svg
    contact_person = Empty-To-Null $_.contact_person
    contact_position = Empty-To-Null $_.contact_position
    contact_number = Empty-To-Null $_.contact_number
    contact_email = Empty-To-Null $_.contact_email
    background = Empty-To-Null $_.background
  }
}

$partnerToolDetails = Import-Csv $PartnerToolDetailsCsv -Delimiter ';' | ForEach-Object {
  [ordered]@{
    id = Empty-To-Null $_.id
    partner_id = Empty-To-Null $_.partner_id
    proposal_id = Empty-To-Null $_.proposal_id
    tool_name = Empty-To-Null $_.tool_name
    risk_classification = Empty-To-Null $_.risk_classification
    intended_use = Empty-To-Null $_.intended_use
    privacy_impact_assessment = Empty-To-Null $_.privacy_impact_assessment
    compliance_assessment = Empty-To-Null $_.compliance_assessment
    responsible_officer = Empty-To-Null $_.responsible_officer
    oversight_mechanism = Empty-To-Null $_.oversight_mechanism
    created_at = Empty-To-Null $_.created_at
    updated_at = Empty-To-Null $_.updated_at
    risk_approved = Bool-Or-Default $_.risk_approved
    risk_approved_by = Map-UserId $_.risk_approved_by
    risk_approved_at = Empty-To-Null $_.risk_approved_at
    tool_url = Empty-To-Null $_.tool_url
    description = Empty-To-Null $_.description
    tool_objective = Empty-To-Null $_.tool_objective
    target_users = Empty-To-Null $_.target_users
    estimated_users = Empty-To-Null $_.estimated_users
    use_case = Empty-To-Null $_.use_case
    budget = Empty-To-Null $_.budget
    tech_requirements = Empty-To-Null $_.tech_requirements
    training_required = Empty-To-Null $_.training_required
    tool_logo_svg = Empty-To-Null $_.tool_logo_svg
  }
}

$userRoles = Import-Csv $UserRolesCsv -Delimiter ';' | ForEach-Object {
  [ordered]@{
    id = Empty-To-Null $_.id
    user_id = Map-UserId $_.user_id
    role = Empty-To-Null $_.role
    created_at = Empty-To-Null $_.created_at
  }
}

Invoke-Upsert "profiles" $profiles $supabaseUrl $headers
Invoke-Upsert "partners" $partners $supabaseUrl $headers
Invoke-Upsert "partner_tool_details" $partnerToolDetails $supabaseUrl $headers
Invoke-Upsert "user_roles" $userRoles $supabaseUrl $headers
