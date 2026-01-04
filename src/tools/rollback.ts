import { z } from 'zod';
import { FileManager } from '../utils/files.js';

const RollbackSchema = z.object({
  backup_id: z.string().optional()
});

export async function rollbackTool(args: unknown) {
  const { backup_id } = RollbackSchema.parse(args);
  const fileManager = new FileManager();
  
  const backups = await fileManager.listBackups();
  
  if (backups.length === 0) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: "No backups available"
        })
      }]
    };
  }
  
  // If no backup_id, show available backups
  if (!backup_id) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          message: "Available backups:",
          backups: backups.map(b => ({
            id: b.id,
            timestamp: b.timestamp,
            age: getRelativeTime(b.timestamp)
          }))
        })
      }]
    };
  }
  
  // Restore specific backup
  const backup = backups.find(b => b.id === backup_id);
  if (!backup) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: `Backup ${backup_id} not found`
        })
      }]
    };
  }
  
  // Read backup and restore
  const backupData = await fileManager.readJSON(backup.path);
  await fileManager.writeJSON('.aura/state.json', backupData);
  
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        success: true,
        message: `✅ Restored backup from ${getRelativeTime(backup.timestamp)}`,
        backup_id: backup.id,
        timestamp: backup.timestamp
      })
    }]
  };
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}