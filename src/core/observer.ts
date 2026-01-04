import type { ObservedPatterns } from '../types/index.js';

export class PatternObserver {
  private patterns: ObservedPatterns = {
    frameworks: [],
    languages: [],
    imports: [],
    patterns: [],
    tech_detected: []
  };
  
  observe(message: string, response: string): void {
    this.detectLanguages(message, response);
    this.detectFrameworks(response);
    this.detectImports(response);
    this.detectPatterns(response);
  }
  
  private detectLanguages(message: string, response: string): void {
    const combined = message + ' ' + response;
    const languages = {
      typescript: /typescript|\.ts\b/i,
      javascript: /javascript|\.js\b/i,
      python: /python|\.py\b/i,
      java: /\bjava\b|\.java\b/i,
      go: /\bgo\b|golang|\.go\b/i,
      rust: /\brust\b|\.rs\b/i,
      csharp: /c#|csharp|\.cs\b/i
    };
    
    for (const [lang, pattern] of Object.entries(languages)) {
      if (pattern.test(combined) && !this.patterns.languages.includes(lang)) {
        this.patterns.languages.push(lang);
      }
    }
  }
  
  private detectFrameworks(response: string): void {
    const frameworks = {
      'React': /react/i,
      'Next.js': /next\.js|nextjs/i,
      'Vue': /vue\.js|vuejs/i,
      'Express': /express/i,
      'FastAPI': /fastapi/i,
      'Django': /django/i,
      'Flask': /flask/i,
      'Spring': /spring boot|spring/i,
      'NestJS': /nestjs/i
    };
    
    for (const [framework, pattern] of Object.entries(frameworks)) {
      if (pattern.test(response) && !this.patterns.frameworks.includes(framework)) {
        this.patterns.frameworks.push(framework);
      }
    }
  }
  
  private detectImports(response: string): void {
    // Detect import patterns
    const importPatterns = [
      /import .* from ['"](.+)['"]/g,
      /from (\w+) import/g,
      /require\(['"](.+)['"]\)/g
    ];
    
    for (const pattern of importPatterns) {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        const imported = match[1];
        if (imported && !this.patterns.imports.includes(imported)) {
          this.patterns.imports.push(imported);
        }
      }
    }
  }
  
  private detectPatterns(response: string): void {
    const patterns = {
      'async/await': /async\s+function|await\s+/i,
      'type hints': /:\s*\w+\s*=|def\s+\w+\([^)]*:\s*\w+/i,
      'error handling': /try\s*{|except:|catch\s*\(/i,
      'testing': /test|describe\(|it\(/i,
      'REST API': /\/api\/|router\.|@app\.(get|post|put|delete)/i
    };
    
    for (const [pattern, regex] of Object.entries(patterns)) {
      if (regex.test(response) && !this.patterns.patterns.includes(pattern)) {
        this.patterns.patterns.push(pattern);
      }
    }
  }
  
  getPatterns(): ObservedPatterns {
    return { ...this.patterns };
  }
  
  inferTechStack(): string[] {
    const tech = [
      ...this.patterns.languages,
      ...this.patterns.frameworks
    ];
    return [...new Set(tech)];
  }
  
  inferProjectGoal(): string {
    const hasAPI = this.patterns.patterns.includes('REST API');
    const hasReact = this.patterns.frameworks.includes('React');
    const hasTesting = this.patterns.patterns.includes('testing');
    
    if (hasReact && hasAPI) {
      return 'Full-stack web application with React frontend and API backend';
    } else if (hasReact) {
      return 'React web application';
    } else if (hasAPI) {
      return 'REST API backend service';
    } else if (hasTesting) {
      return 'Testing infrastructure setup';
    } else {
      return 'Software development project';
    }
  }
}