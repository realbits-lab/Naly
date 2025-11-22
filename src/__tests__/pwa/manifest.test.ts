import fs from 'fs';
import path from 'path';

describe('PWA Manifest', () => {
  let manifest: any;

  beforeAll(() => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    manifest = JSON.parse(manifestContent);
  });

  describe('Basic Properties', () => {
    test('should have required name property', () => {
      expect(manifest.name).toBeDefined();
      expect(typeof manifest.name).toBe('string');
      expect(manifest.name.length).toBeGreaterThan(0);
    });

    test('should have required short_name property', () => {
      expect(manifest.short_name).toBeDefined();
      expect(typeof manifest.short_name).toBe('string');
      expect(manifest.short_name.length).toBeGreaterThan(0);
      expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    });

    test('should have description', () => {
      expect(manifest.description).toBeDefined();
      expect(typeof manifest.description).toBe('string');
    });

    test('should have start_url', () => {
      expect(manifest.start_url).toBeDefined();
      expect(manifest.start_url).toBe('/');
    });

    test('should have display mode set to standalone', () => {
      expect(manifest.display).toBeDefined();
      expect(manifest.display).toBe('standalone');
    });
  });

  describe('Theme and Colors', () => {
    test('should have theme_color', () => {
      expect(manifest.theme_color).toBeDefined();
      expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    test('should have background_color', () => {
      expect(manifest.background_color).toBeDefined();
      expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    test('should use dark theme colors', () => {
      expect(manifest.theme_color).toBe('#171717');
      expect(manifest.background_color).toBe('#0a0a0a');
    });
  });

  describe('Icons', () => {
    test('should have icons array', () => {
      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);
    });

    test('should have required icon sizes', () => {
      const requiredSizes = ['192x192', '512x512'];
      const iconSizes = manifest.icons.map((icon: any) => icon.sizes);

      requiredSizes.forEach(size => {
        expect(iconSizes).toContain(size);
      });
    });

    test('should have all standard PWA icon sizes', () => {
      const standardSizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512'];
      const iconSizes = manifest.icons.map((icon: any) => icon.sizes);

      standardSizes.forEach(size => {
        expect(iconSizes).toContain(size);
      });
    });

    test('all icons should have valid properties', () => {
      manifest.icons.forEach((icon: any) => {
        expect(icon.src).toBeDefined();
        expect(icon.sizes).toBeDefined();
        expect(icon.type).toBeDefined();
        expect(icon.purpose).toBeDefined();
      });
    });

    test('icon files should exist', () => {
      manifest.icons.forEach((icon: any) => {
        const iconPath = path.join(process.cwd(), 'public', icon.src);
        expect(fs.existsSync(iconPath)).toBe(true);
      });
    });

    test('icons should be SVG format', () => {
      manifest.icons.forEach((icon: any) => {
        expect(icon.type).toBe('image/svg+xml');
        expect(icon.src).toMatch(/\.svg$/);
      });
    });
  });

  describe('Additional Properties', () => {
    test('should have orientation preference', () => {
      expect(manifest.orientation).toBeDefined();
      expect(manifest.orientation).toBe('portrait-primary');
    });

    test('should have scope defined', () => {
      expect(manifest.scope).toBeDefined();
      expect(manifest.scope).toBe('/');
    });

    test('should have lang and dir properties', () => {
      expect(manifest.lang).toBe('en');
      expect(manifest.dir).toBe('ltr');
    });

    test('should have categories', () => {
      expect(manifest.categories).toBeDefined();
      expect(Array.isArray(manifest.categories)).toBe(true);
      expect(manifest.categories).toContain('news');
    });
  });

  describe('App Shortcuts', () => {
    test('should have shortcuts defined', () => {
      expect(manifest.shortcuts).toBeDefined();
      expect(Array.isArray(manifest.shortcuts)).toBe(true);
    });

    test('shortcuts should have valid structure', () => {
      if (manifest.shortcuts && manifest.shortcuts.length > 0) {
        manifest.shortcuts.forEach((shortcut: any) => {
          expect(shortcut.name).toBeDefined();
          expect(shortcut.url).toBeDefined();
          expect(typeof shortcut.name).toBe('string');
          expect(typeof shortcut.url).toBe('string');
        });
      }
    });
  });
});
