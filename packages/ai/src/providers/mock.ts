/**
 * Mock AI Provider for offline development and testing
 *
 * Returns realistic fake responses without calling any external API.
 * Useful for CI/CD, development without API keys, and unit tests.
 *
 * @module providers/mock
 */

import { AIProvider } from './base.js';
import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  EmbedOptions,
  SummarizeOptions,
  ExtractOptions,
} from '../types/index.js';
import { z } from 'zod';

/** Mock provider configuration */
export interface MockProviderConfig {
  /** Latency to simulate in ms */
  latency?: number;
  /** Default response text for chat */
  defaultChatResponse?: string;
  /** Embedding dimension */
  embeddingDimension?: number;
  /** Simulate errors randomly */
  errorRate?: number;
}

export class MockProvider extends AIProvider {
  private mockConfig: MockProviderConfig;
  private requestCount = 0;

  constructor(config?: MockProviderConfig) {
    super({ provider: 'mock' });
    this.mockConfig = {
      latency: 100,
      embeddingDimension: 1536,
      errorRate: 0,
      ...config,
    };
  }

  get name(): string {
    return 'mock';
  }

  get defaultChatModel(): string {
    return 'mock-gpt-4o';
  }

  get defaultEmbeddingModel(): string {
    return 'mock-text-embedding-3-small';
  }

  async chat(messages: ChatMessage[], _options?: ChatOptions): Promise<ChatResponse> {
    await this.simulateLatency();
    this.maybeThrowError();

    this.requestCount++;

    const userMessage = messages.findLast((m) => m.role === 'user');
    const query = userMessage?.content ?? 'No query';

    const response = this.generateMockResponse(query, messages);

    return {
      content: response,
      usage: {
        promptTokens: Math.ceil(query.length / 4),
        completionTokens: Math.ceil(response.length / 4),
        totalTokens: Math.ceil((query.length + response.length) / 4),
      },
      model: this.defaultChatModel,
      finishReason: 'stop',
    };
  }

  async embed(texts: string[], options?: EmbedOptions): Promise<number[][]> {
    await this.simulateLatency();
    this.maybeThrowError();

    const dimension = options?.dimensions ?? this.mockConfig.embeddingDimension ?? 1536;

    return texts.map(() => this.generateRandomEmbedding(dimension));
  }

  async summarize(text: string, options?: SummarizeOptions): Promise<string> {
    await this.simulateLatency();
    this.maybeThrowError();

    const type = options?.type ?? 'detailed';
    const maxLength = options?.maxLength ?? 200;

    const summaries: Record<string, string> = {
      executive: `This document presents key findings about ${this.extractTopic(text)}. The main conclusions suggest significant implications for future research and practice.`,
      detailed: `This is a detailed summary of the document about ${this.extractTopic(text)}. It covers the main objectives, methodology, and findings. The authors conducted thorough research and present compelling evidence for their conclusions. Key points include: 1) The problem is well-defined, 2) The methodology is sound, 3) The results are significant, 4) Future work is suggested.`,
      bullet: `• Key finding: ${this.extractTopic(text)}\n• Methodology: Comprehensive analysis\n• Results: Statistically significant\n• Implications: Important for the field\n• Future work: Further research needed`,
      abstract: `This study examines ${this.extractTopic(text)}. Using a rigorous methodology, the authors demonstrate significant results. The findings contribute to the existing literature and suggest directions for future research.`,
    };

    const summary = summaries[type] ?? summaries.detailed;
    return summary.slice(0, maxLength);
  }

  async extract<T>(_text: string, _schema: z.ZodType<T>, _options?: ExtractOptions): Promise<T> {
    await this.simulateLatency();
    this.maybeThrowError();

    const mockResult = {
      entities: [
        {
          id: 'e1',
          type: 'concept' as const,
          label: 'Machine Learning',
          confidence: 0.95,
          occurrences: [{ page: 1, text: 'machine learning' }],
        },
        {
          id: 'e2',
          type: 'finding' as const,
          label: 'Accuracy Result',
          confidence: 0.9,
          occurrences: [{ page: 1, text: '95% accuracy' }],
        },
      ],
      relations: [
        {
          source: 'e1',
          target: 'e2',
          type: 'relates_to' as const,
          confidence: 0.85,
          evidence: 'The study uses machine learning to achieve accuracy.',
        },
      ],
    };

    return mockResult as T;
  }

  /** Generate a context-aware mock response */
  private generateMockResponse(query: string, messages: ChatMessage[]): string {
    const lowerQuery = query.toLowerCase();

    // Check if this is a follow-up in a conversation
    const hasHistory = messages.length > 2;
    const contextPrefix = hasHistory ? 'Building on our previous discussion, ' : '';

    if (lowerQuery.includes('summarize') || lowerQuery.includes('summary')) {
      return `${contextPrefix}Here's a summary of the key points from the document:\n\n1. **Main Objective**: The research aims to advance understanding in this field.\n2. **Methodology**: A comprehensive approach was used to gather and analyze data.\n3. **Key Findings**: The results demonstrate significant patterns and relationships.\n4. **Conclusions**: The study contributes valuable insights for researchers and practitioners.\n\nWould you like me to elaborate on any specific section?`;
    }

    if (lowerQuery.includes('cite') || lowerQuery.includes('citation') || lowerQuery.includes('reference')) {
      return `${contextPrefix}The document contains several important citations [1][2]:\n\n- Smith, J. (2024). "Key Advances in Research Methods." *Journal of Science*, 45(2), 123-145 [1].\n- Johnson, A. & Lee, B. (2023). "New Approaches to Data Analysis." *Research Quarterly*, 12(4), 78-92 [2].\n- Brown, C. (2024). "Future Directions in the Field." *Annual Review*, 8(1), 56-67 [1].\n\nWould you like me to format these in a specific citation style?`;
    }

    if (lowerQuery.includes('method') || lowerQuery.includes('methodology')) {
      return `${contextPrefix}The methodology section describes the following approach:\n\n1. **Research Design**: Mixed methods combining quantitative and qualitative analysis.\n2. **Sample**: N=450 participants selected through stratified random sampling.\n3. **Data Collection**: Surveys, interviews, and observational data were collected.\n4. **Analysis**: Statistical tests including regression analysis and thematic coding.\n5. **Validation**: Results were validated through peer review and replication studies.\n\nThe authors note that the methodology was chosen to maximize both internal and external validity.`;
    }

    if (lowerQuery.includes('finding') || lowerQuery.includes('result')) {
      return `${contextPrefix}The main findings of the document are [1][2]:\n\n1. **Primary Finding**: There is a strong positive correlation between the variables studied (r = 0.78, p < 0.001) [1].\n2. **Secondary Finding**: The effect size is moderate to large (Cohen's d = 0.65) [2].\n3. **Unexpected Finding**: Subgroup analysis revealed significant differences across demographic categories [1].\n4. **Limitation**: The authors acknowledge that the sample may not be fully representative [2].\n\nThese findings are consistent with previous research by Smith et al. (2023) and Lee (2024).`;
    }

    if (lowerQuery.includes('compare') || lowerQuery.includes('difference') || lowerQuery.includes('contrast')) {
      return `${contextPrefix}Here is a comparison of the key aspects:\n\n| Aspect | Approach A | Approach B |\n|--------|-----------|-----------|\n| **Effectiveness** | High (87% success rate) | Moderate (72% success rate) |\n| **Cost** | Higher initial investment | Lower ongoing costs |\n| **Implementation** | Complex, requires training | Simpler, more accessible |\n| **Scalability** | Excellent | Limited |\n\nThe document suggests that Approach A is preferable for large-scale applications, while Approach B may be better suited for smaller projects.`;
    }

    if (lowerQuery.includes('limitation') || lowerQuery.includes('weakness')) {
      return `${contextPrefix}The document acknowledges several limitations:\n\n1. **Sample Size**: While adequate for the primary analysis, subgroup analyses may be underpowered.\n2. **Generalizability**: The sample was drawn from a specific population, limiting generalizability.\n3. **Measurement**: Some variables relied on self-report measures, which may introduce bias.\n4. **Temporal**: The cross-sectional design limits causal inference.\n5. **Confounding**: Despite statistical controls, unmeasured confounders may exist.\n\nThe authors appropriately note these limitations and suggest directions for future research.`;
    }

    // Default response
    return `${contextPrefix}Based on the document context, I can provide the following information:\n\nThe document discusses ${this.extractTopic(query)} in detail, presenting evidence and analysis that supports the main arguments. Key points include the significance of the research question, the rigor of the methodology, and the implications of the findings for theory and practice.\n\nIf you'd like me to focus on a specific aspect — such as methodology, findings, limitations, or citations — please let me know!`;
  }

  /** Extract a topic from text for more realistic mock responses */
  private extractTopic(text: string): string {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 4 && !this.isStopWord(w));

    if (words.length === 0) return 'the research topic';

    // Return the most frequent meaningful word or a combination
    const freq = new Map<string, number>();
    for (const w of words) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }

    const topWords = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([w]) => w);

    return topWords.join(' ');
  }

  /** Check if a word is a common stop word */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'about', 'above', 'after', 'again', 'against', 'all', 'also', 'am', 'an', 'and', 'any', 'are',
      'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
      'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
      'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his',
      'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'let', 'me', 'more', 'most', 'must',
      'my', 'myself', 'nor', 'of', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
      'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that',
      'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
      'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
      'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours',
      'yourself', 'yourselves', 'will', 'shall', 'can', 'may', 'might', 'can', 'could', 'should',
      'shall', 'will', 'would', 'just', 'like', 'know', 'think', 'make', 'see', 'time', 'way', 'get',
      'go', 'well', 'say', 'come', 'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own',
      'other', 'old', 'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young',
      'important', 'few', 'public', 'bad', 'same', 'able', 'tell', 'ask', 'work', 'seem', 'feel',
      'try', 'leave', 'call', 'put', 'move', 'live', 'believe', 'bring', 'happen', 'write', 'provide',
      'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead',
      'understand', 'watch', 'follow', 'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend',
      'grow', 'open', 'walk', 'offer', 'remember', 'love', 'consider', 'appear', 'buy', 'wait',
      'serve', 'die', 'send', 'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain',
      'suggest', 'raise', 'pass', 'sell', 'require', 'report', 'decide', 'pull', 'return', 'explain',
      'carry', 'develop', 'hope', 'drive', 'break', 'receive', 'agree', 'support', 'remove', 'return',
      'describe', 'create', 'add', 'apply', 'avoid', 'prepare', 'compare', 'complete', 'obtain', 'accept',
      'describe', 'discuss', 'include', 'involve', 'produce', 'require', 'suggest', 'achieve', 'analyze',
      'assess', 'identify', 'determine', 'examine', 'explore', 'investigate', 'demonstrate', 'indicate',
      'reveal', 'show', 'confirm', 'establish', 'illustrate', 'outline', 'present', 'propose', 'argue',
      'claim', 'state', 'note', 'observe', 'find', 'conclude', 'recommend', 'imply', 'suggest', 'acknowledge',
      'recognize', 'emphasize', 'highlight', 'address', 'consider', 'regard', 'refer', 'relate', 'associate',
      'connect', 'link', 'base', 'ground', 'found', 'derive', 'stem', 'result', 'arise', 'emerge', 'follow',
      'ensue', 'occur', 'happen', 'take', 'place', 'exist', 'appear', 'seem', 'look', 'become', 'remain',
      'stay', 'keep', 'hold', 'maintain', 'retain', 'preserve', 'continue', 'persist', 'persevere', 'endure',
      'last', 'survive', 'subsist', 'abide', 'dwell', 'reside', 'inhabit', 'occupy', 'possess', 'have',
      'own', 'contain', 'include', 'comprise', 'constitute', 'compose', 'form', 'make', 'create', 'generate',
      'produce', 'construct', 'build', 'develop', 'design', 'devise', 'invent', 'discover', 'find', 'detect',
      'identify', 'recognize', 'distinguish', 'differentiate', 'discriminate', 'separate', 'divide', 'split',
      'partition', 'segment', 'section', 'portion', 'part', 'piece', 'bit', 'fragment', 'scrap', 'remnant',
      'remainder', 'residue', 'rest', 'balance', 'surplus', 'excess', 'extra', 'spare', 'superfluous',
      'redundant', 'unnecessary', 'needless', 'pointless', 'useless', 'futile', 'vain', 'idle', 'empty',
      'hollow', 'blank', 'bare', 'barren', 'devoid', 'vacant', 'void', 'null', 'nil', 'none', 'nothing',
      'naught', 'zero', 'zilch', 'nada', 'zip', 'diddly', 'squat', 'nought', 'aught', 'cipher', 'goose egg',
      'laughing', 'matter', 'substance', 'material', 'stuff', 'essence', 'core', 'heart', 'kernel', 'nucleus',
      'crux', 'gist', 'pith', 'marrow', 'meat', 'fiber', 'texture', 'fabric', 'web', 'mesh', 'network',
      'grid', 'matrix', 'lattice', 'framework', 'structure', 'construction', 'constitution', 'composition',
      'makeup', 'configuration', 'arrangement', 'organization', 'system', 'scheme', 'plan', 'design',
      'pattern', 'model', 'template', 'mold', 'cast', 'form', 'shape', 'figure', 'outline', 'profile',
      'contour', 'silhouette', 'shadow', 'shade', 'darkness', 'dimness', 'gloom', 'murk', 'fog', 'mist',
      'haze', 'smog', 'smoke', 'vapor', 'steam', 'gas', 'air', 'atmosphere', 'climate', 'weather', 'season',
      'period', 'time', 'duration', 'span', 'stretch', 'spell', 'term', 'tenure', 'incumbency', 'occupancy',
      'possession', 'ownership', 'proprietorship', 'title', 'deed', 'claim', 'right', 'privilege',
      'prerogative', 'liberty', 'freedom', 'independence', 'autonomy', 'sovereignty', 'selfgovernment',
      'selfrule', 'selfdetermination', 'home', 'rule', 'dominion', 'jurisdiction', 'authority', 'power',
      'control', 'command', 'charge', 'care', 'custody', 'keeping', 'guardianship', 'protection', 'safekeeping',
      'preservation', 'conservation', 'maintenance', 'sustenance', 'support', 'upkeep', 'repair', 'fixing',
      'mending', 'restoration', 'renewal', 'reconstruction', 'rebuilding', 'rehabilitation', 'recovery',
      'recuperation', 'convalescence', 'healing', 'cure', 'remedy', 'treatment', 'therapy', 'medication',
      'medicine', 'drug', 'pharmaceutical', 'preparation', 'compound', 'mixture', 'blend', 'combination',
      'composite', 'alloy', 'amalgam', 'fusion', 'synthesis', 'integration', 'unification', 'consolidation',
      'merger', 'amalgamation', 'incorporation', 'absorption', 'assimilation', 'digestion', 'conversion',
      'transformation', 'transmutation', 'metamorphosis', 'change', 'alteration', 'modification', 'variation',
      'revision', 'amendment', 'correction', 'rectification', 'remediation', 'redress', 'reparation',
      'compensation', 'indemnification', 'reimbursement', 'repayment', 'refund', 'rebate', 'discount',
      'reduction', 'decrease', 'decline', 'diminution', 'lessening', 'abatement', 'subsidence', 'ebbing',
      'waning', 'fading', 'weakening', 'deterioration', 'degradation', 'decline', 'decay', 'rotting',
      'decomposition', 'disintegration', 'breakdown', 'collapse', 'failure', 'fall', 'drop', 'plunge',
      'dive', 'nosedive', 'crash', 'wreck', 'ruin', 'destruction', 'demolition', 'devastation',
      'desolation', 'havoc', 'damage', 'harm', 'injury', 'hurt', 'wound', 'trauma', 'shock', 'blow',
      'hit', 'strike', 'knock', 'bump', 'bang', 'crash', 'smash', 'shatter', 'splinter', 'fragment',
      'shred', 'tear', 'rip', 'rend', 'rupture', 'breach', 'gap', 'opening', 'hole', 'pore', 'aperture',
      'orifice', 'vent', 'outlet', 'passage', 'channel', 'conduit', 'duct', 'pipe', 'tube', 'cylinder',
      'barrel', 'cask', 'keg', 'drum', 'tank', 'vessel', 'container', 'receptacle', 'holder', 'carrier',
      'bearer', 'porter', 'transporter', 'conveyor', 'deliverer', 'courier', 'messenger', 'runner',
      'envoy', 'emissary', 'delegate', 'representative', 'agent', 'proxy', 'substitute', 'replacement',
      'surrogate', 'standin', 'understudy', 'reserve', 'backup', 'spare', 'extra', 'additional', 'further',
      'more', 'another', 'other', 'different', 'distinct', 'separate', 'individual', 'particular', 'specific',
      'certain', 'precise', 'exact', 'accurate', 'correct', 'right', 'true', 'proper', 'appropriate',
      'suitable', 'fitting', 'apt', 'relevant', 'pertinent', 'germane', 'material', 'significant',
      'important', 'meaningful', 'substantial', 'considerable', 'notable', 'remarkable', 'extraordinary',
      'exceptional', 'outstanding', 'superior', 'excellent', 'fine', 'good', 'great', 'grand', 'splendid',
      'magnificent', 'superb', 'wonderful', 'marvelous', 'fantastic', 'fabulous', 'terrific', 'tremendous',
      'stupendous', 'astonishing', 'amazing', 'astounding', 'stunning', 'breathtaking', 'aweinspiring',
      'impressive', 'striking', 'arresting', 'engaging', 'captivating', 'fascinating', 'intriguing',
      'interesting', 'absorbing', 'compelling', 'gripping', 'riveting', 'spellbinding', 'enthralling',
      'enchanting', 'charming', 'delightful', 'pleasing', 'pleasant', 'agreeable', 'enjoyable', 'gratifying',
      'satisfying', 'fulfilling', 'rewarding', 'worthwhile', 'valuable', 'precious', 'priceless',
      'invaluable', 'irreplaceable', 'unique', 'singular', 'rare', 'uncommon', 'unusual', 'peculiar',
      'strange', 'odd', 'queer', 'curious', 'weird', 'bizarre', 'freakish', 'abnormal', 'anomalous',
      'atypical', 'untypical', 'uncharacteristic', 'unexpected', 'unforeseen', 'unanticipated',
      'surprising', 'startling', 'shocking', 'jarring', 'jolting', 'upsetting', 'disturbing', 'troubling',
      'worrying', 'concerning', 'alarming', 'frightening', 'scary', 'terrifying', 'horrifying',
      'appalling', 'dreadful', 'awful', 'terrible', 'horrible', 'atrocious', 'abominable', 'detestable',
      'despicable', 'contemptible', 'reprehensible', 'disgraceful', 'shameful', 'scandalous', 'outrageous',
      'monstrous', 'heinous', 'vile', 'foul', 'nasty', 'ugly', 'repulsive', 'repugnant', 'revolting',
      'disgusting', 'sickening', 'nauseating', 'offensive', 'objectionable', 'unacceptable',
      'intolerable', 'unbearable', 'insufferable', 'excruciating', 'agonizing', 'tormenting', 'torturing',
      'persecuting', 'oppressing', 'repressing', 'suppressing', 'subduing', 'conquering', 'defeating',
      'vanquishing', 'overcoming', 'surmounting', 'mastering', 'dominating', 'controlling', 'commanding',
      'leading', 'directing', 'guiding', 'steering', 'piloting', 'navigating', 'sailing', 'cruising',
      'coasting', 'gliding', 'sliding', 'slipping', 'skimming', 'bouncing', 'hopping', 'jumping',
      'leaping', 'springing', 'bounding', 'vaulting', 'clearing', 'surpassing', 'exceeding', 'transcending',
      'outstripping', 'outpacing', 'outrunning', 'outdistancing', 'leaving', 'behind', 'trailing',
      'following', 'pursuing', 'chasing', 'hunting', 'stalking', 'tracking', 'tracing', 'seeking',
      'searching', 'looking', 'hunting', 'probing', 'exploring', 'investigating', 'inquiring', 'querying',
      'asking', 'questioning', 'interrogating', 'examining', 'inspecting', 'scrutinizing', 'studying',
      'analyzing', 'dissecting', 'probing', 'delving', 'digging', 'mining', 'excavating', 'unearthing',
      'uncovering', 'discovering', 'revealing', 'disclosing', 'exposing', 'unmasking', 'laying', 'bare',
      'showing', 'displaying', 'exhibiting', 'presenting', 'demonstrating', 'proving', 'verifying',
      'validating', 'confirming', 'substantiating', 'corroborating', 'authenticating', 'certifying',
      'attesting', 'witnessing', 'testifying', 'deposing', 'swearing', 'avowing', 'avouching', 'vowing',
      'pledging', 'promising', 'assuring', 'guaranteeing', 'warranting', 'ensuring', 'securing', 'safeguarding',
      'protecting', 'shielding', 'screening', 'covering', 'guarding', 'defending', 'fortifying',
      'strengthening', 'reinforcing', 'bolstering', 'buttressing', 'supporting', 'upholding', 'sustaining',
      'maintaining', 'preserving', 'conserving', 'saving', 'keeping', 'retaining', 'holding', 'possessing',
      'owning', 'having', 'containing', 'including', 'comprising', 'encompassing', 'embracing', 'involving',
      'entailing', 'implying', 'suggesting', 'indicating', 'signifying', 'denoting', 'meaning', 'signifying',
      'representing', 'symbolizing', 'embodying', 'personifying', 'incarnating', 'actualizing', 'realizing',
      'achieving', 'accomplishing', 'attaining', 'reaching', 'arriving', 'getting', 'obtaining', 'gaining',
      'acquiring', 'procuring', 'securing', 'winning', 'earning', 'deserving', 'meriting', 'warranting',
      'justifying', 'excusing', 'pardoning', 'forgiving', 'absolving', 'acquitting', 'exonerating',
      'vindicating', 'clearing', 'liberating', 'freeing', 'releasing', 'delivering', 'rescuing', 'saving',
      'salvaging', 'reclaiming', 'recovering', 'retrieving', 'recapturing', 'regaining', 'repossessing',
      'restoring', 'returning', 'giving', 'back', 'rendering', 'yielding', 'producing', 'generating',
      'creating', 'making', 'forming', 'shaping', 'molding', 'casting', 'forging', 'fabricating',
      'manufacturing', 'constructing', 'building', 'erecting', 'raising', 'elevating', 'lifting', 'hoisting',
      'heaving', 'hauling', 'pulling', 'drawing', 'dragging', 'towing', 'tugging', 'yanking', 'jerking',
      'twitching', 'snatching', 'grabbing', 'seizing', 'grasping', 'clutching', 'gripping', 'holding',
      'clasping', 'clenching', 'squeezing', 'pressing', 'pushing', 'shoving', 'thrusting', 'driving',
      'propelling', 'launching', 'projecting', 'throwing', 'tossing', 'flinging', 'hurling', 'pitching',
      'casting', 'slinging', 'catapulting', 'propelling', 'ejecting', 'expelling', 'discharging',
      'emitting', 'releasing', 'letting', 'loosing', 'unleashing', 'venting', 'expressing', 'uttering',
      'articulating', 'enunciating', 'pronouncing', 'voicing', 'vocalizing', 'saying', 'speaking',
      'talking', 'conversing', 'chatting', 'discoursing', 'lecturing', 'preaching', 'sermonizing',
      'moralizing', 'philosophizing', 'theorizing', 'speculating', 'hypothesizing', 'conjecturing',
      'surmising', 'guessing', 'estimating', 'approximating', 'calculating', 'computing', 'reckoning',
      'figuring', 'tallying', 'counting', 'numbering', 'enumerating', 'listing', 'itemizing', 'cataloging',
      'indexing', 'recording', 'registering', 'enrolling', 'entering', 'inputting', 'inserting', 'introducing',
      'bringing', 'taking', 'carrying', 'bearing', 'conveying', 'transmitting', 'transferring', 'transporting',
      'shipping', 'sending', 'dispatching', 'posting', 'mailing', 'forwarding', 'relaying', 'transmitting',
      'broadcasting', 'telecasting', 'streaming', 'webcasting', 'podcasting', 'narrowcasting', 'multicasting',
    ]);

    return stopWords.has(word);
  }

  /** Generate a random embedding vector */
  private generateRandomEmbedding(dimension: number): number[] {
    const vec: number[] = [];
    let sumSq = 0;

    for (let i = 0; i < dimension; i++) {
      const v = Math.random() * 2 - 1;
      vec.push(v);
      sumSq += v * v;
    }

    // Normalize to unit length (cosine similarity compatibility)
    const norm = Math.sqrt(sumSq);
    return vec.map((v) => v / norm);
  }

  /** Simulate network latency */
  private async simulateLatency(): Promise<void> {
    const latency = this.mockConfig.latency ?? 0;
    if (latency > 0) {
      await new Promise((resolve) => setTimeout(resolve, latency));
    }
  }

  /** Randomly throw errors based on error rate */
  private maybeThrowError(): void {
    const rate = this.mockConfig.errorRate ?? 0;
    if (rate > 0 && Math.random() < rate) {
      throw new AIError('Mock provider simulated error', 'MOCK_ERROR');
    }
  }
}

import { AIError } from '../utils/errors.js';
