/**
 * DiffService - Computes differences between two text strings
 * Supports word-level and line-level diffing with similarity metrics
 */

interface Change {
  type: 'add' | 'remove' | 'replace' | 'equal';
  value: string;
  index?: number;
}

interface DiffResult {
  changes: Change[];
  similarity: number;
}

interface LineChange {
  type: 'add' | 'remove' | 'replace' | 'equal';
  content: string;
  lineNumber: number;
}

interface DeltaStats {
  additions: number;
  deletions: number;
  charDelta: number;
}

export class DiffService {
  /**
   * Compute character-level differences between original and modified text
   */
  computeDiff(original: string, modified: string): DiffResult {
    if (original === modified) {
      return {
        changes: [],
        similarity: 1,
      };
    }

    const changes = this.computeWordDiff(original, modified);
    const similarity = this.calculateSimilarity(original, modified);

    return { changes, similarity };
  }

  /**
   * Compute word-level differences
   */
  private computeWordDiff(original: string, modified: string): Change[] {
    const originalWords = this.tokenize(original);
    const modifiedWords = this.tokenize(modified);

    const changes: Change[] = [];
    const lcs = this.longestCommonSubsequence(originalWords, modifiedWords);

    let origIdx = 0;
    let modIdx = 0;
    let lcsIdx = 0;

    while (lcsIdx < lcs.length) {
      const word = lcs[lcsIdx];

      // Find where this word appears in original
      while (origIdx < originalWords.length && originalWords[origIdx] !== word) {
        changes.push({ type: 'remove', value: originalWords[origIdx] });
        origIdx++;
      }

      // Find where this word appears in modified
      while (modIdx < modifiedWords.length && modifiedWords[modIdx] !== word) {
        changes.push({ type: 'add', value: modifiedWords[modIdx] });
        modIdx++;
      }

      // Move past the matching word
      if (origIdx < originalWords.length && modIdx < modifiedWords.length) {
        changes.push({ type: 'equal', value: word });
        origIdx++;
        modIdx++;
      }

      lcsIdx++;
    }

    // Add remaining words as removals or additions
    while (origIdx < originalWords.length) {
      changes.push({ type: 'remove', value: originalWords[origIdx] });
      origIdx++;
    }

    while (modIdx < modifiedWords.length) {
      changes.push({ type: 'add', value: modifiedWords[modIdx] });
      modIdx++;
    }

    return changes;
  }

  /**
   * Compute line-level differences
   */
  getLineChanges(original: string, modified: string): LineChange[] {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');

    const changes: LineChange[] = [];
    const lcs = this.longestCommonSubsequence(originalLines, modifiedLines);

    let origIdx = 0;
    let modIdx = 0;
    let lcsIdx = 0;

    while (lcsIdx < lcs.length) {
      const line = lcs[lcsIdx];

      // Removed lines
      while (origIdx < originalLines.length && originalLines[origIdx] !== line) {
        changes.push({
          type: 'remove',
          content: originalLines[origIdx],
          lineNumber: origIdx + 1,
        });
        origIdx++;
      }

      // Added lines
      while (modIdx < modifiedLines.length && modifiedLines[modIdx] !== line) {
        changes.push({
          type: 'add',
          content: modifiedLines[modIdx],
          lineNumber: modIdx + 1,
        });
        modIdx++;
      }

      // Matching line
      if (origIdx < originalLines.length && modIdx < modifiedLines.length) {
        changes.push({
          type: 'equal',
          content: line,
          lineNumber: modIdx + 1,
        });
        origIdx++;
        modIdx++;
      }

      lcsIdx++;
    }

    // Remaining lines
    while (origIdx < originalLines.length) {
      changes.push({
        type: 'remove',
        content: originalLines[origIdx],
        lineNumber: origIdx + 1,
      });
      origIdx++;
    }

    while (modIdx < modifiedLines.length) {
      changes.push({
        type: 'add',
        content: modifiedLines[modIdx],
        lineNumber: modIdx + 1,
      });
      modIdx++;
    }

    return changes;
  }

  /**
   * Calculate statistics about changes between texts
   */
  getDeltaStats(original: string, modified: string): DeltaStats {
    const changes = this.computeDiff(original, modified);

    const additions = changes.changes.filter(c => c.type === 'add').length;
    const deletions = changes.changes.filter(c => c.type === 'remove').length;
    const charDelta = modified.length - original.length;

    return {
      additions,
      deletions,
      charDelta,
    };
  }

  /**
   * Calculate similarity score (0 to 1)
   */
  private calculateSimilarity(original: string, modified: string): number {
    if (original === modified) return 1;
    if (original.length === 0 && modified.length === 0) return 1;
    if (original.length === 0 || modified.length === 0) return 0;

    const lcs = this.longestCommonSubsequence(
      this.tokenize(original),
      this.tokenize(modified)
    );
    const maxLength = Math.max(
      this.tokenize(original).length,
      this.tokenize(modified).length
    );

    return maxLength === 0 ? 1 : lcs.length / maxLength;
  }

  /**
   * Simple tokenization by words and spaces
   */
  private tokenize(text: string): string[] {
    return text.match(/\S+|\s+/g) || [];
  }

  /**
   * Longest Common Subsequence algorithm
   */
  private longestCommonSubsequence(
    arr1: string[],
    arr2: string[]
  ): string[] {
    const m = arr1.length;
    const n = arr2.length;

    // Create DP table
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    // Fill DP table
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to find LCS
    const lcs: string[] = [];
    let i = m;
    let j = n;

    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        lcs.unshift(arr1[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return lcs;
  }
}
