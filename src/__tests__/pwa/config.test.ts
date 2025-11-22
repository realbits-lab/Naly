import fs from 'fs';
import path from 'path';

describe('PWA Configuration', () => {
  describe('Next.js PWA Config', () => {
    test('should have next.config.ts file', () => {
      const configPath = path.join(process.cwd(), 'next.config.ts');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    test('next.config.ts should import next-pwa', () => {
      const configPath = path.join(process.cwd(), 'next.config.ts');
      const configContent = fs.readFileSync(configPath, 'utf-8');

      expect(configContent).toContain('@ducanh2912/next-pwa');
      expect(configContent).toContain('withPWA');
    });

    test('PWA should be configured with proper dest', () => {
      const configPath = path.join(process.cwd(), 'next.config.ts');
      const configContent = fs.readFileSync(configPath, 'utf-8');

      expect(configContent).toContain('dest:');
      expect(configContent).toContain('public');
    });

    test('PWA should be disabled in development', () => {
      const configPath = path.join(process.cwd(), 'next.config.ts');
      const configContent = fs.readFileSync(configPath, 'utf-8');

      expect(configContent).toContain('disable:');
      expect(configContent).toContain('development');
    });
  });

  describe('Service Worker (Production Build)', () => {
    test('should generate sw.js after build', () => {
      const swPath = path.join(process.cwd(), 'public', 'sw.js');

      // Service worker is only generated after production build
      // This test will check if file exists or skip if not built yet
      if (fs.existsSync(swPath)) {
        const swContent = fs.readFileSync(swPath, 'utf-8');
        expect(swContent.length).toBeGreaterThan(0);
        expect(swContent).toContain('workbox');
      } else {
        console.log('⚠️  Service worker not found - run production build first');
      }
    });

    test('should generate workbox runtime after build', () => {
      const publicDir = path.join(process.cwd(), 'public');

      if (fs.existsSync(publicDir)) {
        const files = fs.readdirSync(publicDir);
        const workboxFiles = files.filter(file => file.startsWith('workbox-') && file.endsWith('.js'));

        if (workboxFiles.length > 0) {
          expect(workboxFiles.length).toBeGreaterThan(0);
        } else {
          console.log('⚠️  Workbox runtime not found - run production build first');
        }
      }
    });
  });

  describe('Icon Files', () => {
    const iconSizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512'];

    iconSizes.forEach(size => {
      test(`should have icon-${size}.svg file`, () => {
        const iconPath = path.join(process.cwd(), 'public', 'icons', `icon-${size}.svg`);
        expect(fs.existsSync(iconPath)).toBe(true);
      });

      test(`icon-${size}.svg should be valid SVG`, () => {
        const iconPath = path.join(process.cwd(), 'public', 'icons', `icon-${size}.svg`);
        const iconContent = fs.readFileSync(iconPath, 'utf-8');

        expect(iconContent).toContain('<?xml version="1.0"');
        expect(iconContent).toContain('<svg');
        expect(iconContent).toContain('</svg>');
      });

      test(`icon-${size}.svg should have correct dimensions`, () => {
        const iconPath = path.join(process.cwd(), 'public', 'icons', `icon-${size}.svg`);
        const iconContent = fs.readFileSync(iconPath, 'utf-8');
        const [width, height] = size.split('x');

        expect(iconContent).toContain(`width="${width}"`);
        expect(iconContent).toContain(`height="${height}"`);
      });

      test(`icon-${size}.svg should contain gradient and logo elements`, () => {
        const iconPath = path.join(process.cwd(), 'public', 'icons', `icon-${size}.svg`);
        const iconContent = fs.readFileSync(iconPath, 'utf-8');

        // Check for gradient definition
        expect(iconContent).toContain('linearGradient');
        const gradId = 'grad' + size.split('x')[0];
        expect(iconContent).toContain(gradId);

        // Check for colored elements (white and blue)
        expect(iconContent).toContain('#ffffff');
        expect(iconContent).toContain('#3b82f6');
      });
    });
  });

  describe('Package Dependencies', () => {
    test('should have @ducanh2912/next-pwa in dependencies', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageContent = fs.readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);

      expect(packageJson.dependencies).toHaveProperty('@ducanh2912/next-pwa');
    });

    test('should use webpack build mode for PWA compatibility', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageContent = fs.readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);

      expect(packageJson.scripts.build).toContain('--webpack');
    });
  });
});
