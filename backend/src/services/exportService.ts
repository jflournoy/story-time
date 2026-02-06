export interface ExportOptions {
  text: string;
  synopsis?: string;
}

export class ExportService {
  /**
   * Export text content as plain text
   */
  exportToText(options: ExportOptions): string {
    return options.text;
  }

  /**
   * Export text content as Markdown
   */
  exportToMarkdown(options: ExportOptions): string {
    let markdown = '';

    if (options.synopsis) {
      markdown += `# Synopsis\n\n${options.synopsis}\n\n---\n\n`;
    }

    markdown += `# Content\n\n${options.text}`;

    return markdown;
  }

  /**
   * Export text and synopsis as JSON
   */
  exportToJSON(options: ExportOptions): string {
    return JSON.stringify(
      {
        text: options.text,
        synopsis: options.synopsis || null,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }
}
