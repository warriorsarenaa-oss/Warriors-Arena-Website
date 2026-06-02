import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  try {
    const files = readdirSync(dirPath);

    files.forEach(function(file) {
      if (statSync(dirPath + "/" + file).isDirectory()) {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      } else {
        arrayOfFiles.push(join(dirPath, "/", file));
      }
    });

    return arrayOfFiles;
  } catch (e) {
    return arrayOfFiles; // Directory might not exist
  }
}

describe('Architecture: Separation of Concerns', () => {
  
  it('UI components in /components/UI do not import from @/lib/db/supabase', () => {
    const uiDir = join(process.cwd(), 'src/components/UI');
    const files = getAllFiles(uiDir);
    
    files.filter(f => f.endsWith('.tsx') || f.endsWith('.ts')).forEach(file => {
      const content = readFileSync(file, 'utf-8');
      expect(content).not.toContain('@/lib/db/supabase');
    });
  });

  it('API routes do not contain JSX', () => {
    const apiDir = join(process.cwd(), 'src/app/api');
    const files = getAllFiles(apiDir);
    
    files.filter(f => f.endsWith('route.ts')).forEach(file => {
      const content = readFileSync(file, 'utf-8');
      // A heuristic to check if it's returning JSX or using className
      expect(content).not.toContain('className=');
      expect(content).not.toContain('<div');
      expect(content).not.toContain('<span');
    });
  });

  it('Server components do not use useState or useEffect', () => {
    const srcDir = join(process.cwd(), 'src/components');
    const files = getAllFiles(srcDir);
    
    files.filter(f => f.endsWith('.tsx')).forEach(file => {
      const content = readFileSync(file, 'utf-8');
      const isClientComponent = content.includes("'use client'") || 
                                content.includes('"use client"');
      
      if (!isClientComponent) {
        expect(content).not.toContain('useState(');
        expect(content).not.toContain('useEffect(');
      }
    });
  });
});
