import fs from 'fs/promises';
import path from 'path';

export class FileManager {
  private auraDir = '.aura';
  
  async ensureAuraDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.auraDir, { recursive: true });
      await fs.mkdir(path.join(this.auraDir, 'backups'), { recursive: true });
    } catch (error) {
      console.error('Failed to create .aura directory:', error);
      throw error;
    }
  }
  
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  async readJSON<T>(filePath: string): Promise<T | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }
  
  async writeJSON(filePath: string, data: any): Promise<void> {
    const tmpPath = `${filePath}.tmp`;
    try {
      // Atomic write: write to temp file first
      await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      // Then rename (atomic operation)
      await fs.rename(tmpPath, filePath);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tmpPath);
      } catch {}
      throw error;
    }
  }
  
  async readMarkdown(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }
  
  async writeMarkdown(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf-8');
  }
  
  async createBackup(sourceFile: string): Promise<string> {
    const timestamp = Date.now();
    const backupPath = path.join(this.auraDir, 'backups', `backup-${timestamp}.json`);
    
    try {
      const content = await fs.readFile(sourceFile, 'utf-8');
      await fs.writeFile(backupPath, content, 'utf-8');
      
      // Keep only last 5 backups
      await this.rotateBackups();
      
      return backupPath;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }
  
  private async rotateBackups(): Promise<void> {
    const backupsDir = path.join(this.auraDir, 'backups');
    const files = await fs.readdir(backupsDir);
    const backups = files
      .filter(f => f.startsWith('backup-'))
      .sort()
      .reverse();
    
    // Delete old backups (keep only 5 most recent)
    for (const backup of backups.slice(5)) {
      await fs.unlink(path.join(backupsDir, backup));
    }
  }
  
  async listBackups(): Promise<Array<{ id: string; timestamp: Date; path: string }>> {
    const backupsDir = path.join(this.auraDir, 'backups');
    const files = await fs.readdir(backupsDir);
    
    return files
      .filter(f => f.startsWith('backup-'))
      .map(f => {
        const timestamp = parseInt(f.replace('backup-', '').replace('.json', ''));
        return {
          id: f,
          timestamp: new Date(timestamp),
          path: path.join(backupsDir, f)
        };
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}