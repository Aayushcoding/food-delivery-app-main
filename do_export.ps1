# do_export.ps1 - Generates PROJECT_EXPORT.txt from all source files
# =============================================================
# HOW TO RUN (one command, from anywhere):
#   powershell -ExecutionPolicy Bypass -File "c:\Users\Aayush\Desktop\infosys-project-main\food-delivery-app-main\do_export.ps1"
#
# Or if you're already in the project folder in PowerShell:
#   .\do_export.ps1
# =============================================================

$root   = $PSScriptRoot
$output = Join-Path $root "PROJECT_EXPORT.txt"
$div    = "=" * 60

# ── EXPLICIT FILE LIST ────────────────────────────────────────
# Every source file in the project. Add new files here as they
# are created so future exports stay complete.
$files = @(
  # Root docs
  "README.md",
  "REQUIREMENTS.txt",

  # ── BACKEND ─────────────────────────────────────────────────
  "backend/.env.example",
  "backend/package.json",
  "backend/server.js",
  "backend/seed-agent.js",

  # config
  "backend/config/db.js",

  # middleware
  "backend/middleware/auth.js",
  "backend/middleware/agentAuth.js",
  "backend/middleware/upload.js",
  "backend/middleware/errorHandler.js",

  # models
  "backend/models/Counter.js",
  "backend/models/User.js",
  "backend/models/Restaurant.js",
  "backend/models/Menu.js",
  "backend/models/Cart.js",
  "backend/models/Order.js",
  "backend/models/DeliveryAgent.js",
  "backend/models/Review.js",

  # controllers
  "backend/controllers/authController.js",
  "backend/controllers/userController.js",
  "backend/controllers/restaurantController.js",
  "backend/controllers/menuController.js",
  "backend/controllers/cartController.js",
  "backend/controllers/orderController.js",
  "backend/controllers/deliveryController.js",
  "backend/controllers/reviewController.js",

  # routes
  "backend/routes/authRoutes.js",
  "backend/routes/userRoutes.js",
  "backend/routes/restaurantRoutes.js",
  "backend/routes/menuRoutes.js",
  "backend/routes/cartRoutes.js",
  "backend/routes/orderRoutes.js",
  "backend/routes/agentRoutes.js",
  "backend/routes/reviewRoutes.js",

  # utils & scripts
  "backend/utils/counter.js",
  "backend/scripts/migrate-city-lowercase.js",
  "backend/scripts/fix-all-data.js",

  # ── FRONTEND ─────────────────────────────────────────────────
  "frontend/proxy.conf.json",
  "frontend/angular.json",
  "frontend/package.json",
  "frontend/tsconfig.json",
  "frontend/tsconfig.app.json",
  "frontend/tsconfig.spec.json",

  # src root
  "frontend/src/main.ts",
  "frontend/src/index.html",
  "frontend/src/styles.css",

  # environments
  "frontend/src/environments/environment.ts",
  "frontend/src/environments/environment.prod.ts",

  # app root
  "frontend/src/app/app.module.ts",
  "frontend/src/app/app-routing.module.ts",
  "frontend/src/app/app.component.ts",
  "frontend/src/app/app.component.html",
  "frontend/src/app/app.component.css",

  # auth
  "frontend/src/app/auth/auth/auth.component.ts",
  "frontend/src/app/auth/auth/auth.component.html",
  "frontend/src/app/auth/auth/auth.component.css",
  "frontend/src/app/auth/landing/landing.component.ts",
  "frontend/src/app/auth/landing/landing.component.html",
  "frontend/src/app/auth/landing/landing.component.css",

  # core
  "frontend/src/app/core/guards/auth.guard.ts",
  "frontend/src/app/core/services/auth.service.ts",
  "frontend/src/app/core/services/login.service.ts",
  "frontend/src/app/core/services/customer.service.ts",
  "frontend/src/app/core/services/menu.service.ts",
  "frontend/src/app/core/services/order.service.ts",
  "frontend/src/app/core/services/profile.service.ts",
  "frontend/src/app/core/services/delivery.service.ts",
  "frontend/src/app/core/services/review.service.ts",

  # agent
  "frontend/src/app/agent/agent-dashboard/agent-dashboard.component.ts",
  "frontend/src/app/agent/agent-dashboard/agent-dashboard.component.html",
  "frontend/src/app/agent/agent-dashboard/agent-dashboard.component.css",
  "frontend/src/app/agent/agent-profile/agent-profile.component.ts",
  "frontend/src/app/agent/agent-profile/agent-profile.component.html",
  "frontend/src/app/agent/agent-profile/agent-profile.component.css",

  # customer
  "frontend/src/app/customer/customer-home/customer-home.component.ts",
  "frontend/src/app/customer/customer-home/customer-home.component.html",
  "frontend/src/app/customer/customer-home/customer-home.component.css",
  "frontend/src/app/customer/customer-menu/customer-menu.component.ts",
  "frontend/src/app/customer/customer-menu/customer-menu.component.html",
  "frontend/src/app/customer/customer-menu/customer-menu.component.css",
  "frontend/src/app/customer/customer-cart/customer-cart.component.ts",
  "frontend/src/app/customer/customer-cart/customer-cart.component.html",
  "frontend/src/app/customer/customer-cart/customer-cart.component.css",
  "frontend/src/app/customer/customer-orders/customer-orders.component.ts",
  "frontend/src/app/customer/customer-orders/customer-orders.component.html",
  "frontend/src/app/customer/customer-orders/customer-orders.component.css",
  "frontend/src/app/customer/customer-profile/customer-profile.component.ts",
  "frontend/src/app/customer/customer-profile/customer-profile.component.html",
  "frontend/src/app/customer/customer-profile/customer-profile.component.css",
  "frontend/src/app/customer/item-card/item-card.component.ts",
  "frontend/src/app/customer/item-card/item-card.component.html",
  "frontend/src/app/customer/item-card/item-card.component.css",
  "frontend/src/app/customer/success/success.component.ts",
  "frontend/src/app/customer/success/success.component.html",
  "frontend/src/app/customer/success/success.component.css",
  "frontend/src/app/customer/discounts/discounts.component.ts",
  "frontend/src/app/customer/discounts/discounts.component.html",
  "frontend/src/app/customer/discounts/discounts.component.css",
  "frontend/src/app/customer/invoice/invoice.component.ts",
  "frontend/src/app/customer/invoice/invoice.component.html",
  "frontend/src/app/customer/invoice/invoice.component.css",
  "frontend/src/app/customer/reviews/reviews.component.ts",
  "frontend/src/app/customer/reviews/reviews.component.html",
  "frontend/src/app/customer/reviews/reviews.component.css",

  # RestaurantOwner
  "frontend/src/app/RestaurantOwner/home-page/home-page.component.ts",
  "frontend/src/app/RestaurantOwner/home-page/home-page.component.html",
  "frontend/src/app/RestaurantOwner/home-page/home-page.component.css",
  "frontend/src/app/RestaurantOwner/menu/menu.component.ts",
  "frontend/src/app/RestaurantOwner/menu/menu.component.html",
  "frontend/src/app/RestaurantOwner/menu/menu.component.css",
  "frontend/src/app/RestaurantOwner/orders/orders.component.ts",
  "frontend/src/app/RestaurantOwner/orders/orders.component.html",
  "frontend/src/app/RestaurantOwner/orders/orders.component.css",
  "frontend/src/app/RestaurantOwner/profile/profile.component.ts",
  "frontend/src/app/RestaurantOwner/profile/profile.component.html",
  "frontend/src/app/RestaurantOwner/profile/profile.component.css",
  "frontend/src/app/RestaurantOwner/owner-dashboard/owner-dashboard.component.ts",
  "frontend/src/app/RestaurantOwner/owner-dashboard/owner-dashboard.component.html",
  "frontend/src/app/RestaurantOwner/owner-dashboard/owner-dashboard.component.css"
)

# ── AUTO-DISCOVER any .ts/.js/.html/.css files not in the list above ──
# This ensures new files added in future are never silently skipped.
$skipDirs = @('node_modules','.git','dist','.angular','uploads')
$autoFiles = Get-ChildItem -Path $root -Recurse -File | Where-Object {
  $skip = $false
  foreach ($d in $skipDirs) { if ($_.FullName -match "\\$d\\") { $skip = $true; break } }
  if ($skip) { return $false }
  if ($_.Name -eq (Split-Path $output -Leaf)) { return $false }  # skip the output file itself
  $_.Extension -in @('.js','.ts','.html','.css','.json','.md','.txt','.ps1','.example')
} | ForEach-Object {
  $_.FullName.Replace($root + "\", "").Replace("\", "/")
} | Sort-Object

$knownSet  = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($f in $files) { [void]$knownSet.Add($f) }

$autoAdded = $autoFiles | Where-Object { -not $knownSet.Contains($_) }

# ── BUILD OUTPUT ─────────────────────────────────────────────
$out = New-Object System.Collections.Generic.List[string]
$out.Add($div)
$out.Add("BYTEBITES - FOOD DELIVERY SYSTEM")
$out.Add("Full Project Export - Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')")
$out.Add("Node 24.14.0 | Angular 15.2.11 | MongoDB 8.2.5")
$out.Add($div)
$out.Add("")

$missing = @()
$allFiles = @($files) + @($autoAdded)

$i = 0
foreach ($rel in $allFiles) {
  $i++
  $full = Join-Path $root ($rel -replace "/", "\")
  $tag  = if ($knownSet.Contains($rel)) { "" } else { " [AUTO-DISCOVERED]" }
  $out.Add($div)
  $out.Add("FILE ($i/$($allFiles.Count)): $rel$tag")
  $out.Add($div)
  if (Test-Path $full) {
    $content = [System.IO.File]::ReadAllText($full, [System.Text.Encoding]::UTF8)
    $out.Add($content)
  } else {
    $out.Add("<<< FILE NOT FOUND: $rel >>>")
    $missing += $rel
  }
  $out.Add("")
}

# Assets listing (binary, not included as text)
$out.Add($div)
$out.Add("ASSETS: frontend/src/assets/")
$out.Add($div)
$out.Add("Files (binary - not in text export):")
$assetDir = Join-Path $root "frontend\src\assets"
if (Test-Path $assetDir) {
  Get-ChildItem $assetDir -Recurse -File | ForEach-Object {
    $rel2  = $_.FullName.Replace($root + "\", "").Replace("\", "/")
    $sizeKb = [math]::Round($_.Length / 1KB, 1)
    $out.Add("  - $rel2 ($sizeKb KB)")
  }
}
$out.Add("")
$out.Add($div)
$out.Add("END OF EXPORT")
$out.Add($div)

[System.IO.File]::WriteAllLines($output, $out, [System.Text.Encoding]::UTF8)

# ── SUMMARY ──────────────────────────────────────────────────
$sizeKb = [math]::Round((Get-Item $output).Length / 1KB, 1)
Write-Host ""
Write-Host "Export written to: $output ($sizeKb KB)" -ForegroundColor Cyan

if ($autoAdded.Count -gt 0) {
  Write-Host "Auto-discovered $($autoAdded.Count) extra file(s) not in the explicit list:" -ForegroundColor Cyan
  $autoAdded | ForEach-Object { Write-Host "  + $_" -ForegroundColor Cyan }
}

if ($missing.Count -gt 0) {
  Write-Host "WARNING - $($missing.Count) file(s) listed but NOT found on disk:" -ForegroundColor Yellow
  $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
} else {
  Write-Host "All $($allFiles.Count) files included successfully." -ForegroundColor Green
}
Write-Host ""
