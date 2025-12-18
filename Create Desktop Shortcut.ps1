# PowerShell script to create a proper Windows desktop shortcut for Volt1.1
# Run this script to create a desktop shortcut with an icon

$TargetPath = "c:\Users\kylet\Documents\Antigravity\Volt1.1\Start Volt1.1.bat"
$ShortcutPath = [Environment]::GetFolderPath("Desktop") + "\Volt1.1.lnk"
$Description = "Launch Volt1.1 Quote Application"

# Create WScript Shell object
$WScriptShell = New-Object -ComObject WScript.Shell

# Create shortcut
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetPath
$Shortcut.Description = $Description
$Shortcut.WorkingDirectory = "c:\Users\kylet\Documents\Antigravity\Volt1.1"

# Save the shortcut
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "Location: $ShortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now double-click the Volt1.1 shortcut on your desktop to launch the application." -ForegroundColor White
