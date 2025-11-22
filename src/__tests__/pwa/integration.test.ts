import fs from 'fs';
import path from 'path';

describe('PWA Integration Tests', () => {
  describe('PWA Compliance', () => {
    test('should have all required PWA files', () => {
      const requiredFiles = [
        'public/manifest.json',
        'src/app/layout.tsx',
        'src/app/offline/page.tsx',
        'next.config.ts',
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have minimum required icon sizes for PWA', () => {
      const requiredIconSizes = ['192x192', '512x512'];

      requiredIconSizes.forEach(size => {
        const iconPath = path.join(process.cwd(), 'public', 'icons', `icon-${size}.svg`);
        expect(fs.existsSync(iconPath)).toBe(true);
      });
    });

    test('manifest should be valid JSON', () => {
      const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');

      expect(() => JSON.parse(manifestContent)).not.toThrow();
    });

    test('manifest should have PWA-required fields', () => {
      const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];

      requiredFields.forEach(field => {
        expect(manifest).toHaveProperty(field);
        expect(manifest[field]).toBeDefined();
      });
    });
  });

  describe('Theme Consistency', () => {
    test('theme colors should be consistent across manifest and layout', () => {
      const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
      const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

      const manifestTheme = manifest.theme_color;
      expect(layoutContent).toContain(manifestTheme);
    });

    test('icons should use consistent color scheme', () => {
      const iconPath = path.join(process.cwd(), 'public', 'icons', 'icon-192x192.svg');
      const iconContent = fs.readFileSync(iconPath, 'utf-8');

      // Check for dark gradient colors
      expect(iconContent).toContain('#171717');
      expect(iconContent).toContain('#0a0a0a');

      // Check for accent color
      expect(iconContent).toContain('#3b82f6');
    });
  });

  describe('File Structure', () => {
    test('should have icons directory', () => {
      const iconsDir = path.join(process.cwd(), 'public', 'icons');
      expect(fs.existsSync(iconsDir)).toBe(true);
      expect(fs.statSync(iconsDir).isDirectory()).toBe(true);
    });

    test('icons directory should contain all required icons', () => {
      const iconsDir = path.join(process.cwd(), 'public', 'icons');
      const iconFiles = fs.readdirSync(iconsDir);

      const expectedIcons = [
        'icon-72x72.svg',
        'icon-96x96.svg',
        'icon-128x128.svg',
        'icon-144x144.svg',
        'icon-152x152.svg',
        'icon-192x192.svg',
        'icon-384x384.svg',
        'icon-512x512.svg',
      ];

      expectedIcons.forEach(icon => {
        expect(iconFiles).toContain(icon);
      });
    });

    test('should have offline page route', () => {
      const offlinePage = path.join(process.cwd(), 'src', 'app', 'offline', 'page.tsx');
      expect(fs.existsSync(offlinePage)).toBe(true);
    });
  });

  describe('Build Configuration', () => {
    test('should use webpack mode for PWA', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.build).toContain('--webpack');
    });

    test('should have PWA dependencies installed', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(packageJson.dependencies).toHaveProperty('@ducanh2912/next-pwa');
    });
  });

  describe('Documentation', () => {
    test('should have PWA setup documentation', () => {
      const docsPath = path.join(process.cwd(), 'docs', 'PWA_SETUP.md');
      expect(fs.existsSync(docsPath)).toBe(true);
    });

    test('PWA documentation should be comprehensive', () => {
      const docsPath = path.join(process.cwd(), 'docs', 'PWA_SETUP.md');
      const docsContent = fs.readFileSync(docsPath, 'utf-8');

      const expectedSections = [
        'Overview',
        'Configuration',
        'Testing',
        'Deployment',
      ];

      expectedSections.forEach(section => {
        expect(docsContent.toLowerCase()).toContain(section.toLowerCase());
      });
    });
  });

  describe('Accessibility', () => {
    test('manifest should have proper lang and dir attributes', () => {
      const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      expect(manifest.lang).toBe('en');
      expect(manifest.dir).toBe('ltr');
    });

    test('icons should have purpose defined', () => {
      const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      manifest.icons.forEach((icon: any) => {
        expect(icon.purpose).toBeDefined();
        expect(icon.purpose).toContain('maskable');
      });
    });
  });

  describe('Performance Considerations', () => {
    test('SVG icons should be small in size', () => {
      const iconPath = path.join(process.cwd(), 'public', 'icons', 'icon-192x192.svg');
      const stats = fs.statSync(iconPath);

      // SVG icons should typically be under 5KB
      expect(stats.size).toBeLessThan(5 * 1024);
    });

    test('manifest file should be small', () => {
      const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
      const stats = fs.statSync(manifestPath);

      // Manifest should typically be under 5KB
      expect(stats.size).toBeLessThan(5 * 1024);
    });
  });
});
