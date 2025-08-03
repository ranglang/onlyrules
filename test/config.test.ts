import { existsSync } from 'node:fs';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type OnlyRulesConfig,
  configExists,
  getConfigPath,
  getConfigTargets,
  readConfig,
  updateConfigTargets,
  writeConfig,
} from '../src/utils/config';

describe('Config Management', () => {
  const testConfigPath = join(process.cwd(), 'onlyrules.json');

  beforeEach(async () => {
    // Clean up any existing config file before each test
    if (existsSync(testConfigPath)) {
      await unlink(testConfigPath);
    }
  });

  afterEach(async () => {
    // Clean up config file after each test
    if (existsSync(testConfigPath)) {
      await unlink(testConfigPath);
    }
  });

  describe('getConfigPath', () => {
    it('should return the correct config file path', () => {
      const path = getConfigPath();
      expect(path).toBe(testConfigPath);
      expect(path.endsWith('onlyrules.json')).toBe(true);
    });
  });

  describe('configExists', () => {
    it('should return false when config file does not exist', () => {
      expect(configExists()).toBe(false);
    });

    it('should return true when config file exists', async () => {
      await writeFile(testConfigPath, '{}', 'utf-8');
      expect(configExists()).toBe(true);
    });
  });

  describe('readConfig', () => {
    it('should return empty config when file does not exist', async () => {
      const config = await readConfig();
      expect(config).toEqual({});
    });

    it('should read valid config file', async () => {
      const testConfig: OnlyRulesConfig = {
        target: ['cursor', 'windsurf'],
      };
      await writeFile(testConfigPath, JSON.stringify(testConfig), 'utf-8');

      const config = await readConfig();
      expect(config).toEqual(testConfig);
    });

    it('should return empty config for invalid JSON', async () => {
      await writeFile(testConfigPath, 'invalid json', 'utf-8');

      const config = await readConfig();
      expect(config).toEqual({});
    });

    it('should handle empty config file', async () => {
      await writeFile(testConfigPath, '{}', 'utf-8');

      const config = await readConfig();
      expect(config).toEqual({});
    });
  });

  describe('writeConfig', () => {
    it('should create new config file', async () => {
      const testConfig: OnlyRulesConfig = {
        target: ['cursor', 'windsurf'],
      };

      await writeConfig(testConfig);

      expect(existsSync(testConfigPath)).toBe(true);
      const content = await readFile(testConfigPath, 'utf-8');
      const parsedConfig = JSON.parse(content);
      expect(parsedConfig).toEqual(testConfig);
    });

    it('should format JSON with proper indentation', async () => {
      const testConfig: OnlyRulesConfig = {
        target: ['cursor', 'windsurf'],
      };

      await writeConfig(testConfig);

      const content = await readFile(testConfigPath, 'utf-8');
      expect(content).toContain('  '); // Should have indentation
      expect(content).toMatch(/{\n {2}"target": \[\n {4}"cursor",\n {4}"windsurf"\n {2}\]\n}/);
    });
  });

  describe('updateConfigTargets', () => {
    it('should create new config file with targets', async () => {
      const targets = ['cursor', 'windsurf'];

      await updateConfigTargets(targets);

      expect(existsSync(testConfigPath)).toBe(true);
      const config = await readConfig();
      expect(config.target).toEqual(targets);
    });

    it('should update existing config file', async () => {
      // Create initial config with different targets
      const initialConfig: OnlyRulesConfig = {
        target: ['claude'],
      };
      await writeConfig(initialConfig);

      // Update with new targets
      const newTargets = ['cursor', 'windsurf'];
      await updateConfigTargets(newTargets);

      const config = await readConfig();
      expect(config.target).toEqual(newTargets);
    });

    it('should preserve other config fields when updating targets', async () => {
      // Create config with additional fields (future extensibility)
      const initialConfig = {
        target: ['claude'],
        someOtherField: 'value',
      };
      await writeFile(testConfigPath, JSON.stringify(initialConfig), 'utf-8');

      // Update targets
      const newTargets = ['cursor', 'windsurf'];
      await updateConfigTargets(newTargets);

      const config = await readConfig();
      expect(config.target).toEqual(newTargets);
      expect((config as any).someOtherField).toBe('value');
    });

    it('should handle empty targets array', async () => {
      await updateConfigTargets([]);

      const config = await readConfig();
      expect(config.target).toEqual([]);
    });
  });

  describe('getConfigTargets', () => {
    it('should return empty array when config does not exist', async () => {
      const targets = await getConfigTargets();
      expect(targets).toEqual([]);
    });

    it('should return empty array when target field is not set', async () => {
      await writeConfig({});

      const targets = await getConfigTargets();
      expect(targets).toEqual([]);
    });

    it('should return targets from config', async () => {
      const expectedTargets = ['cursor', 'windsurf'];
      await updateConfigTargets(expectedTargets);

      const targets = await getConfigTargets();
      expect(targets).toEqual(expectedTargets);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete workflow: create, read, update', async () => {
      // Initially no config
      expect(configExists()).toBe(false);
      expect(await getConfigTargets()).toEqual([]);

      // Create config with targets
      await updateConfigTargets(['cursor']);
      expect(configExists()).toBe(true);
      expect(await getConfigTargets()).toEqual(['cursor']);

      // Update targets
      await updateConfigTargets(['cursor', 'windsurf']);
      expect(await getConfigTargets()).toEqual(['cursor', 'windsurf']);

      // Update to different targets
      await updateConfigTargets(['claude', 'gemini']);
      expect(await getConfigTargets()).toEqual(['claude', 'gemini']);
    });
  });
});
