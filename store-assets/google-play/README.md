# Google Play Store Assets

Final listing assets for Google Play live in this folder.

## Files

- `app-icon-512.png` - 512x512 PNG icon for Google Play listing upload.
- `feature-graphic.png` - 1024x500 PNG feature graphic for Google Play listing upload.
- `feature-graphic.html` - editable source used to render `feature-graphic.png`.
- `render-feature-graphic.ps1` - reproducible Windows render script for `feature-graphic.png`.

## Upload Notes

- App icon: 512x512 PNG, with alpha, under 1024 KB.
- Feature graphic: 1024x500 PNG or JPEG, no alpha, under 15 MB.
- Keep signing files, generated APK/AAB outputs, service-account files, and private store credentials out of the repository.

Render the feature graphic from the repository root:

```powershell
.\store-assets\google-play\render-feature-graphic.ps1
```
