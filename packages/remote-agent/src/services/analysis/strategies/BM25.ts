/**
 * BM25 Implementation
 * 
 * Implements the BM25 ranking function for text search and relevance scoring.
 * Based on the Okapi BM25 algorithm.
 */

export class BM25 {
  private k1: number;
  private b: number;
  private avgDocLength: number;
  private docFreq: Map<string, number>;
  private docLengths: Map<string, number>;
  private termFreq: Map<string, Map<string, number>>;
  private totalDocs: number;

  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
    this.avgDocLength = 0;
    this.docFreq = new Map();
    this.docLengths = new Map();
    this.termFreq = new Map();
    this.totalDocs = 0;
  }

  /**
   * Add a document to the index
   */
  addDocument(docId: string, content: string) {
    const terms = this.tokenize(content);
    this.docLengths.set(docId, terms.length);
    this.totalDocs++;
    
    // Update term frequencies
    const termFreqMap = new Map<string, number>();
    for (const term of terms) {
      termFreqMap.set(term, (termFreqMap.get(term) || 0) + 1);
      this.docFreq.set(term, (this.docFreq.get(term) || 0) + 1);
    }
    this.termFreq.set(docId, termFreqMap);

    // Update average document length
    this.avgDocLength = Array.from(this.docLengths.values()).reduce((a, b) => a + b, 0) / this.totalDocs;
  }

  /**
   * Score a document against a query
   */
  score(docId: string, query: string): number {
    const terms = this.tokenize(query);
    const docLength = this.docLengths.get(docId) || 0;
    const termFreqMap = this.termFreq.get(docId) || new Map();
    
    let score = 0;
    for (const term of terms) {
      const tf = termFreqMap.get(term) || 0;
      const df = this.docFreq.get(term) || 0;
      
      if (df === 0) continue;
      
      const idf = Math.log((this.totalDocs - df + 0.5) / (df + 0.5) + 1);
      const numerator = tf * (this.k1 + 1);
      const denominator = tf + this.k1 * (1 - this.b + this.b * docLength / this.avgDocLength);
      
      score += idf * numerator / denominator;
    }
    
    return score;
  }

  /**
   * Score multiple documents against a query
   */
  scoreDocuments(query: string, docIds: string[]): Array<{ docId: string; score: number }> {
    return docIds
      .map(docId => ({
        docId,
        score: this.score(docId, query)
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Tokenize text into terms
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 0);
  }
} 