import fs from 'fs';
import path from 'path';

describe('PWA Metadata', () => {
  let layoutContent: string;

  beforeAll(() => {
    const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');
    layoutContent = fs.readFileSync(layoutPath, 'utf-8');
  });

  describe('App Layout Metadata', () => {
    test('should export metadata object', () => {
      expect(layoutContent).toContain('export const metadata');
      expect(layoutContent).toContain(': Metadata');
    });

    test('should have manifest reference', () => {
      expect(layoutContent).toContain('manifest:');
      expect(layoutContent).toContain('/manifest.json');
    });

    test('should have theme color', () => {
      expect(layoutContent).toContain('themeColor:');
      expect(layoutContent).toContain('#171717');
    });

    test('should have title and description', () => {
      expect(layoutContent).toContain('title:');
      expect(layoutContent).toContain('description:');
      expect(layoutContent).toContain('Naly');
    });

    test('should have PWA icons', () => {
      expect(layoutContent).toContain('icons:');
      expect(layoutContent).toContain('icon:');
      expect(layoutContent).toContain('apple:');
    });

    test('should reference correct icon path', () => {
      expect(layoutContent).toContain('/icons/icon-192x192.svg');
    });
  });

  describe('Apple Web App Configuration', () => {
    test('should have appleWebApp configuration', () => {
      expect(layoutContent).toContain('appleWebApp:');
    });

    test('should enable web app capable', () => {
      expect(layoutContent).toContain('capable: true');
    });

    test('should have status bar style', () => {
      expect(layoutContent).toContain('statusBarStyle:');
      expect(layoutContent).toContain('black-translucent');
    });

    test('should have app title for Apple devices', () => {
      expect(layoutContent).toContain('title:');
      // Check in appleWebApp context
      const appleWebAppMatch = layoutContent.match(/appleWebApp:\s*{[^}]*}/s);
      if (appleWebAppMatch) {
        expect(appleWebAppMatch[0]).toContain('title:');
      }
    });
  });

  describe('Viewport Configuration', () => {
    test('should export viewport configuration', () => {
      expect(layoutContent).toContain('export const viewport');
      expect(layoutContent).toContain(': Viewport');
    });

    test('should have responsive viewport settings', () => {
      expect(layoutContent).toContain('width:');
      expect(layoutContent).toContain('device-width');
    });

    test('should have initial scale', () => {
      expect(layoutContent).toContain('initialScale:');
    });
  });

  describe('Import Statements', () => {
    test('should import Metadata type from next', () => {
      expect(layoutContent).toContain("import type { Metadata");
      expect(layoutContent).toContain("} from 'next'");
    });

    test('should import Viewport type from next', () => {
      expect(layoutContent).toContain("Viewport");
      expect(layoutContent).toContain("from 'next'");
    });
  });
});
