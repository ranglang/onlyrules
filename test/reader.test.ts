import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

// Mock fs functions
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { isUrl, readRulesFromInput, readRulesFromUrl, readRulesFromFile } from '../src/utils/reader';
import fetch from 'node-fetch';

describe('reader utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isUrl', () => {
    it('should return true for valid HTTP URLs', () => {
      expect(isUrl('http://example.com')).toBe(true);
      expect(isUrl('http://example.com/path')).toBe(true);
      expect(isUrl('http://example.com/path?query=value')).toBe(true);
    });

    it('should return true for valid HTTPS URLs', () => {
      expect(isUrl('https://example.com')).toBe(true);
      expect(isUrl('https://example.com/path')).toBe(true);
      expect(isUrl('https://example.com/path?query=value')).toBe(true);
      expect(isUrl('https://onlyrules.codes/api/rules/raw?id=cmd9nww9z0007l5040oegtmb1')).toBe(true);
    });

    it('should return false for local file paths', () => {
      expect(isUrl('./local-file.md')).toBe(false);
      expect(isUrl('/absolute/path/file.md')).toBe(false);
      expect(isUrl('relative/path/file.md')).toBe(false);
      expect(isUrl('file.md')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isUrl('not-a-url')).toBe(false);
      expect(isUrl('ftp://example.com')).toBe(false);
      expect(isUrl('file://local-file')).toBe(false);
      expect(isUrl('')).toBe(false);
    });
  });

  describe('readRulesFromInput', () => {
    it('should call readRulesFromUrl for URL inputs', async () => {
      const mockFetch = fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('# URL Rules Content'),
      });

      const result = await readRulesFromInput('https://example.com/rules.md');
      
      expect(result).toBe('# URL Rules Content');
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/rules.md');
    });

    it('should call readRulesFromFile for local file inputs', async () => {
      const { readFile } = await import('node:fs/promises');
      const mockReadFile = readFile as any;
      mockReadFile.mockResolvedValueOnce('# Local File Content');

      const result = await readRulesFromInput('./local-rules.md');
      
      expect(result).toBe('# Local File Content');
      expect(mockReadFile).toHaveBeenCalledWith('./local-rules.md', 'utf-8');
    });

    it('should handle URL fetch errors', async () => {
      const mockFetch = fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(readRulesFromInput('https://example.com/nonexistent.md'))
        .rejects.toThrow('Failed to fetch rules from URL: 404 Not Found');
    });

    it('should handle file read errors', async () => {
      const { readFile } = await import('node:fs/promises');
      const mockReadFile = readFile as any;
      mockReadFile.mockRejectedValueOnce(new Error('File not found'));

      await expect(readRulesFromInput('./nonexistent.md'))
        .rejects.toThrow('Error reading rules file: File not found');
    });
  });

  describe('readRulesFromUrl', () => {
    it('should fetch and return content from URL', async () => {
      const mockFetch = fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('# Remote Rules'),
      });

      const result = await readRulesFromUrl('https://example.com/rules.md');
      
      expect(result).toBe('# Remote Rules');
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/rules.md');
    });

    it('should handle HTTP errors', async () => {
      const mockFetch = fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(readRulesFromUrl('https://example.com/error.md'))
        .rejects.toThrow('Error fetching rules from URL: Failed to fetch rules from URL: 500 Internal Server Error');
    });

    it('should handle network errors', async () => {
      const mockFetch = fetch as any;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(readRulesFromUrl('https://example.com/network-error.md'))
        .rejects.toThrow('Error fetching rules from URL: Network error');
    });
  });

  describe('readRulesFromFile', () => {
    it('should read and return content from local file', async () => {
      const { readFile } = await import('node:fs/promises');
      const mockReadFile = readFile as any;
      mockReadFile.mockResolvedValueOnce('# Local Rules Content');

      const result = await readRulesFromFile('./rules.md');
      
      expect(result).toBe('# Local Rules Content');
      expect(mockReadFile).toHaveBeenCalledWith('./rules.md', 'utf-8');
    });

    it('should handle file system errors', async () => {
      const { readFile } = await import('node:fs/promises');
      const mockReadFile = readFile as any;
      mockReadFile.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(readRulesFromFile('./protected.md'))
        .rejects.toThrow('Error reading rules file: Permission denied');
    });
  });
});
