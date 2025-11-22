# ATLAS PWA Icons

This directory contains the Progressive Web App icons for ATLAS.

## Required Icon Sizes

The following icon sizes are required for PWA support:

- **72x72** - Android Chrome
- **96x96** - Android Chrome
- **128x128** - Android Chrome
- **144x144** - Android Chrome, Windows
- **152x152** - iOS Safari
- **192x192** - Android Chrome (required)
- **384x384** - Android Chrome
- **512x512** - Android Chrome (required)

## Generating Icons

You can generate these icons from a single source image using tools like:

1. **PWA Asset Generator**: https://github.com/elegantapp/pwa-asset-generator
   ```bash
   npx pwa-asset-generator source-icon.png ./public/icons
   ```

2. **RealFaviconGenerator**: https://realfavicongenerator.net/

3. **PWA Builder**: https://www.pwabuilder.com/imageGenerator

## Design Guidelines

- Use a simple, recognizable icon
- Ensure good contrast for visibility
- Test on both light and dark backgrounds
- Consider the "safe zone" for maskable icons (80% of the canvas)

## Placeholder

Currently, this directory contains placeholder instructions. Replace this README with actual icon files before deploying to production.
