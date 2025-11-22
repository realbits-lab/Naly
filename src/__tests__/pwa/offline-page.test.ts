import fs from 'fs';
import path from 'path';

describe('Offline Page', () => {
  let offlinePageContent: string;

  beforeAll(() => {
    const offlinePagePath = path.join(process.cwd(), 'src', 'app', 'offline', 'page.tsx');
    offlinePageContent = fs.readFileSync(offlinePagePath, 'utf-8');
  });

  describe('Component Structure', () => {
    test('should be a client component', () => {
      expect(offlinePageContent).toContain("'use client'");
    });

    test('should export default function', () => {
      expect(offlinePageContent).toContain('export default function');
      expect(offlinePageContent).toContain('OfflinePage');
    });

    test('should return React.ReactElement', () => {
      expect(offlinePageContent).toContain('React.ReactElement');
    });
  });

  describe('User Interface Elements', () => {
    test('should have offline message heading', () => {
      expect(offlinePageContent).toContain('Offline');
    });

    test('should have user-friendly messaging', () => {
      expect(offlinePageContent).toContain('internet connection');
    });

    test('should have retry functionality', () => {
      expect(offlinePageContent).toContain('window.location.reload');
      expect(offlinePageContent).toContain('Try Again');
    });

    test('should have icon or visual element', () => {
      expect(offlinePageContent).toContain('<svg');
    });
  });

  describe('Styling', () => {
    test('should use Tailwind CSS classes', () => {
      expect(offlinePageContent).toMatch(/className="[^"]*\b(flex|text-|bg-|p-|m-)/);
    });

    test('should have centered layout', () => {
      expect(offlinePageContent).toContain('items-center');
      expect(offlinePageContent).toContain('justify-center');
    });

    test('should have full height container', () => {
      expect(offlinePageContent).toContain('min-h-screen');
    });
  });

  describe('Accessibility', () => {
    test('should have aria-hidden attributes for decorative elements', () => {
      expect(offlinePageContent).toContain('aria-hidden');
    });

    test('should use semantic HTML', () => {
      expect(offlinePageContent).toContain('<h1');
      expect(offlinePageContent).toContain('<button');
    });
  });
});
