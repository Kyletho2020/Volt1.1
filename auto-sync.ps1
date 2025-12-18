# Auto-sync script for Volt1.1
# This script automatically commits and pushes changes to GitHub every 2 minutes

param(
    [int]$IntervalSeconds = 120  # Default: 2 minutes
)

$ProjectPath = "c:\Users\kylet\Documents\Antigravity\Volt1.1"
Set-Location $ProjectPath

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Volt1.1 Auto-Sync Started" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Monitoring: $ProjectPath" -ForegroundColor White
Write-Host "Sync interval: $IntervalSeconds seconds" -ForegroundColor White
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$syncCount = 0

while ($true) {
    Start-Sleep -Seconds $IntervalSeconds
    
    # Check if there are any changes
    $status = git status --porcelain
    
    if ($status) {
        $syncCount++
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = "Auto-sync #$syncCount - $timestamp"
        
        Write-Host "[$timestamp] Changes detected. Syncing..." -ForegroundColor Yellow
        
        # Stage all changes
        git add -A
        
        # Commit
        git commit -m $commitMessage | Out-Null
        
        # Push to GitHub
        $pushResult = git push 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$timestamp] Successfully synced to GitHub!" -ForegroundColor Green
        } else {
            Write-Host "[$timestamp] Error pushing to GitHub: $pushResult" -ForegroundColor Red
        }
    } else {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] No changes to sync." -ForegroundColor Gray
    }
}
