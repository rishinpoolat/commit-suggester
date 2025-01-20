import { FileChange, CommitSuggestion } from '../types';

export class CommitAnalyzer {
  private defaultTemplates: Record<string, string> = {
    feat: 'feat({scope}): add {component} functionality',
    fix: 'fix({scope}): resolve issue with {component}',
    docs: 'docs({scope}): update documentation for {component}',
    style: 'style({scope}): improve formatting of {component}',
    refactor: 'refactor({scope}): restructure {component}',
    test: 'test({scope}): add tests for {component}',
    perf: 'perf({scope}): improve performance of {component}',
  };

  constructor(private customTemplates?: Record<string, string>) {
    this.defaultTemplates = {
      ...this.defaultTemplates,
      ...customTemplates
    };
  }

  async analyzeBatch(changes: FileChange[]): Promise<CommitSuggestion[]> {
    const suggestions: CommitSuggestion[] = [];

    for (const change of changes) {
      const analysis = this.analyzeChange(change);
      suggestions.push({
        message: this.generateMessage(analysis.type, analysis.scope, analysis.component),
        type: analysis.type,
        scope: analysis.scope,
        source: 'rule',
        confidence: 0.7
      });
    }

    return suggestions;
  }

  private analyzeChange(change: FileChange): {
    type: string;
    scope: string;
    component: string;
  } {
    const type = this.determineChangeType(change);
    const scope = this.determineScope(change.filename);
    const component = this.determineComponent(change.filename);

    return { type, scope, component };
  }

  private determineChangeType(change: FileChange): string {
    if (change.filename.includes('test')) return 'test';
    if (change.filename.includes('docs')) return 'docs';
    if (change.diff.includes('style') || change.filename.includes('css')) return 'style';
    
    // Logic based on the nature of changes
    if (change.additions > change.deletions * 2) return 'feat';
    if (change.deletions > change.additions * 2) return 'refactor';
    return 'fix';
  }

  private determineScope(filename: string): string {
    const parts = filename.split('/');
    return parts.length > 1 ? parts[0] : 'general';
  }

  private determineComponent(filename: string): string {
    const name = filename.split('/').pop() || '';
    return name.split('.')[0];
  }

  private generateMessage(type: string, scope: string, component: string): string {
    const template = this.defaultTemplates[type] || `${type}({scope}): update {component}`;
    return template
      .replace('{scope}', scope)
      .replace('{component}', component);
  }
}