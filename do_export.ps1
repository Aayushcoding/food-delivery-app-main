
# do_export.ps1 - Generates PROJECT_EXPORT.txt from all source files
# Run from project root: powershell -File do_export.ps1

$root    = $PSScriptRoot
$output  = Join-Path $root "PROJECT_EXPORT.txt"
$div     = "=" * 60

$files = @(
  "README.md",
  "REQUIREMENTS.txt",
  "backend/.env.example",
  "backend/package.json",
  "backend/server.js",
  "backend/config/db.js",
  "backend/middleware/auth.js",
  "backend/middleware/upload.js",
  "backend/models/Counter.js",
  "backend/models/User.js",
  "backend/models/Restaurant.js",
  "backend/models/Menu.js",
  "backend/models/Cart.js",
  "backend/models/Order.js",
  "backend/controllers/authController.js",
  "backend/controllers/userController.js",
  "backend/controllers/restaurantController.js",
  "backend/controllers/menuController.js",
  "backend/controllers/cartController.js",
  "backend/controllers/orderController.js",
  "backend/routes/authRoutes.js",
  "backend/routes/userRoutes.js",
  "backend/routes/restaurantRoutes.js",
  "backend/routes/menuRoutes.js",
  "backend/routes/cartRoutes.js",
  "backend/routes/orderRoutes.js",
  "backend/utils/counter.js",
  "backend/utils/dbManager.js",
  "frontend/proxy.conf.json",
  "frontend/angular.json",
  "frontend/package.json",
  "frontend/tsconfig.json",
  "frontend/tsconfig.app.json",
  "frontend/src/main.ts",
  "frontend/src/index.html",
  "frontend/src/styles.css",
  "frontend/src/app/app.module.ts",
  "frontend/src/app/app-routing.module.ts",
  "frontend/src/app/app.component.ts",
  "frontend/src/app/app.component.html",
  "frontend/src/app/auth/login/login.component.ts",
  "frontend/src/app/auth/login/login.component.html",
  "frontend/src/app/auth/login/login.component.css",
  "frontend/src/app/auth/signup/signup.component.ts",
  "frontend/src/app/auth/signup/signup.component.html",
  "frontend/src/app/auth/signup/signup.component.css",
  "frontend/src/app/core/guards/auth.guard.ts",
  "frontend/src/app/core/services/auth.service.ts",
  "frontend/src/app/core/services/login.service.ts",
  "frontend/src/app/core/services/customer.service.ts",
  "frontend/src/app/core/services/menu.service.ts",
  "frontend/src/app/core/services/order.service.ts",
  "frontend/src/app/core/services/profile.service.ts",
  "frontend/src/app/shared/navbar/navbar.component.ts",
  "frontend/src/app/shared/navbar/navbar.component.html",
  "frontend/src/app/shared/navbar/navbar.component.css",
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

$out = New-Object System.Collections.Generic.List[string]
$out.Add($div)
$out.Add("BYTEBITES - FOOD DELIVERY SYSTEM")
$out.Add("Full Project Export - Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')")
$out.Add("Node 24.14.0 | Angular 15.2.11 | MongoDB 8.2.5")
$out.Add($div)
$out.Add("")

$missing = @()
foreach ($rel in $files) {
  $full = Join-Path $root ($rel -replace "/", "\")
  $out.Add($div)
  $out.Add("FILE: $rel")
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

$out.Add($div)
$out.Add("ASSETS: frontend/src/assets/")
$out.Add($div)
$out.Add("Files (binary - not in text export):")
$assetDir = Join-Path $root "frontend\src\assets"
if (Test-Path $assetDir) {
  Get-ChildItem $assetDir | ForEach-Object {
    $sizeKb = [math]::Round($_.Length / 1KB, 1)
    $out.Add("  - $($_.Name) ($sizeKb KB)")
  }
}
$out.Add("")
$out.Add($div)
$out.Add("END OF EXPORT")
$out.Add($div)

[System.IO.File]::WriteAllLines($output, $out, [System.Text.Encoding]::UTF8)

$sizeKb = [math]::Round((Get-Item $output).Length / 1KB, 1)
Write-Host "Export written to: $output ($sizeKb KB)"
if ($missing.Count -gt 0) {
  Write-Host "WARNING - $($missing.Count) file(s) not found:" -ForegroundColor Yellow
  $missing | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
} else {
  Write-Host "All $($files.Count) files included." -ForegroundColor Green
}
