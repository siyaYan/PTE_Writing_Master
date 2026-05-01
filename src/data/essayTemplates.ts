export type EssayTypeId = 'advantages' | 'discuss' | 'problem' | 'agree';

export interface SentenceHint {
  type: 'Simple' | 'Complex' | 'Compound' | 'Complex/Compound' | 'Simple/Compound';
  hint: string;
  template: string;
}

export interface ParagraphDef {
  section: string;
  pattern: string;
  sentences: SentenceHint[];
}

export interface EssayTypeDef {
  id: EssayTypeId;
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
  paragraphs: ParagraphDef[];
}

export const ESSAY_TYPES: EssayTypeDef[] = [
  {
    id: 'advantages',
    label: 'Advantages vs Disadvantages',
    shortLabel: 'Adv / Disadv',
    description: 'Argue that advantages outweigh disadvantages (or vice versa)',
    accent: 'emerald',
    paragraphs: [
      {
        section: 'Introduction',
        pattern: '3 sentences · Simple + Complex + Simple',
        sentences: [
          { type: 'Simple', hint: 'Introduce topic', template: 'People have different views about {topic}.' },
          { type: 'Complex', hint: 'State your position', template: 'Although it has some disadvantages, I believe the advantages are greater.' },
          { type: 'Simple', hint: 'State essay purpose', template: 'This essay will discuss both sides and explain my view.' },
        ],
      },
      {
        section: 'Body Paragraph 1',
        pattern: '5 sentences · Complex + Complex + Compound + Simple + Simple',
        sentences: [
          { type: 'Complex', hint: 'Main advantage', template: 'One major advantage of {topic} is that [idea].' },
          { type: 'Complex', hint: 'Reason', template: 'This is because [reason].' },
          { type: 'Compound', hint: 'Extra support', template: '[Extra support sentence], and this further shows that [point].' },
          { type: 'Simple', hint: 'Example', template: 'For example, [example].' },
          { type: 'Simple', hint: 'Positive result', template: 'Therefore, [positive result].' },
        ],
      },
      {
        section: 'Body Paragraph 2',
        pattern: '5 sentences · Simple + Simple + Complex + Simple + Simple',
        sentences: [
          { type: 'Simple', hint: 'Introduce disadvantage', template: 'However, {topic} also has some disadvantages.' },
          { type: 'Simple', hint: 'Name the problem', template: 'One problem is that [idea].' },
          { type: 'Complex', hint: 'Contrast', template: 'Although [contrast point], [result].' },
          { type: 'Simple', hint: 'Example', template: 'For instance, [example].' },
          { type: 'Simple', hint: 'Concede', template: 'Even so, these problems can often be reduced.' },
        ],
      },
      {
        section: 'Conclusion',
        pattern: '2 sentences · Complex + Simple',
        sentences: [
          { type: 'Complex', hint: 'Summarise both sides', template: 'In conclusion, while {topic} has some negative aspects, its advantages are more significant.' },
          { type: 'Simple', hint: 'Final opinion', template: 'Therefore, I believe the benefits outweigh the disadvantages.' },
        ],
      },
    ],
  },
  {
    id: 'discuss',
    label: 'Discuss Both Views',
    shortLabel: 'Discuss + Opinion',
    description: 'Present both sides then give your own view',
    accent: 'indigo',
    paragraphs: [
      {
        section: 'Introduction',
        pattern: '3 sentences · Simple + Compound + Simple',
        sentences: [
          { type: 'Simple', hint: 'Introduce topic', template: 'People have different views about {topic}.' },
          { type: 'Compound', hint: 'State both sides', template: 'Some believe that [side A], while others think that [side B].' },
          { type: 'Simple', hint: 'Essay purpose', template: 'This essay will discuss both views before giving my opinion.' },
        ],
      },
      {
        section: 'Body Paragraph 1',
        pattern: '5 sentences · Complex + Complex + Simple + Simple + Simple',
        sentences: [
          { type: 'Complex', hint: 'Side A main point', template: 'On the one hand, supporters of [side A] believe that [idea].' },
          { type: 'Complex', hint: 'Reason', template: 'This is because [reason].' },
          { type: 'Simple', hint: 'Extra support', template: '[Extra support sentence].' },
          { type: 'Simple', hint: 'Example', template: 'For example, [example].' },
          { type: 'Simple', hint: 'Result', template: 'Therefore, [result].' },
        ],
      },
      {
        section: 'Body Paragraph 2',
        pattern: '5 sentences · Complex + Complex + Complex + Simple + Simple',
        sentences: [
          { type: 'Complex', hint: 'Side B main point', template: 'On the other hand, those who support [side B] argue that [idea].' },
          { type: 'Complex', hint: 'Reason', template: 'This view is based on the idea that [reason].' },
          { type: 'Complex', hint: 'Contrast', template: 'Although [contrast], [result].' },
          { type: 'Simple', hint: 'Example', template: 'For instance, [example].' },
          { type: 'Simple', hint: 'Result', template: 'As a result, they believe that [result].' },
        ],
      },
      {
        section: 'Conclusion',
        pattern: '2 sentences · Simple + Complex',
        sentences: [
          { type: 'Simple', hint: 'Acknowledge both sides', template: 'In conclusion, both views have strong arguments.' },
          { type: 'Complex', hint: 'Your opinion', template: 'However, I believe that [your opinion] because it is more practical and beneficial in the long term.' },
        ],
      },
    ],
  },
  {
    id: 'problem',
    label: 'Problem & Solution',
    shortLabel: 'Problem / Solution',
    description: 'Identify problems caused by the topic and suggest solutions',
    accent: 'amber',
    paragraphs: [
      {
        section: 'Introduction',
        pattern: '3 sentences · Simple + Simple + Simple',
        sentences: [
          { type: 'Simple', hint: 'Introduce the issue', template: '{Topic} has become an important issue in modern society.' },
          { type: 'Simple', hint: 'State the impact', template: 'It causes several problems for individuals and society.' },
          { type: 'Simple', hint: 'Essay purpose', template: 'This essay will discuss the main problems and suggest effective solutions.' },
        ],
      },
      {
        section: 'Body Paragraph 1',
        pattern: '5 sentences · Complex + Complex + Simple + Simple + Complex',
        sentences: [
          { type: 'Complex', hint: 'Problem 1', template: 'One major problem caused by {topic} is [problem].' },
          { type: 'Complex', hint: 'Reason', template: 'This is because [reason].' },
          { type: 'Simple', hint: 'Extra support', template: '[Extra support sentence].' },
          { type: 'Simple', hint: 'Example', template: 'For example, [example].' },
          { type: 'Complex', hint: 'Solution 1', template: 'A practical solution is to [solution], which would help by [effect].' },
        ],
      },
      {
        section: 'Body Paragraph 2',
        pattern: '5 sentences · Simple + Simple + Complex + Simple + Complex',
        sentences: [
          { type: 'Simple', hint: 'Problem 2', template: 'Another serious problem is [problem 2].' },
          { type: 'Simple', hint: 'Consequence', template: 'This can lead to [result].' },
          { type: 'Complex', hint: 'Contrast', template: 'Although [contrast idea], [negative result].' },
          { type: 'Simple', hint: 'Example', template: 'For instance, [example].' },
          { type: 'Complex', hint: 'Solution 2', template: 'To solve this issue, [solution 2] should be introduced.' },
        ],
      },
      {
        section: 'Conclusion',
        pattern: '2 sentences · Complex + Complex',
        sentences: [
          { type: 'Complex', hint: 'Summarise', template: 'In conclusion, {topic} creates serious problems, but these issues can be addressed through effective action.' },
          { type: 'Complex', hint: 'Forward-looking statement', template: 'If the suggested measures are adopted, the situation can improve significantly.' },
        ],
      },
    ],
  },
  {
    id: 'agree',
    label: 'Agree / Disagree',
    shortLabel: 'Agree / Disagree',
    description: 'Take a clear stance and defend it throughout the essay',
    accent: 'rose',
    paragraphs: [
      {
        section: 'Introduction',
        pattern: '3 sentences · Simple + Complex + Simple',
        sentences: [
          { type: 'Simple', hint: 'Introduce the debate', template: 'Many people have different opinions about {topic}.' },
          { type: 'Complex', hint: 'State your position', template: 'I agree/disagree with this statement because [reason 1] and [reason 2].' },
          { type: 'Simple', hint: 'Essay purpose', template: 'This essay will explain my view.' },
        ],
      },
      {
        section: 'Body Paragraph 1',
        pattern: '5 sentences · Simple + Complex + Simple + Simple + Simple',
        sentences: [
          { type: 'Simple', hint: 'First reason', template: 'One reason is that [idea 1].' },
          { type: 'Complex', hint: 'Explanation', template: 'This is because [reason].' },
          { type: 'Simple', hint: 'Extra support', template: '[Extra support sentence].' },
          { type: 'Simple', hint: 'Example', template: 'For example, [example].' },
          { type: 'Simple', hint: 'Link to opinion', template: 'Therefore, [link to opinion].' },
        ],
      },
      {
        section: 'Body Paragraph 2',
        pattern: '5 sentences · Simple + Simple + Complex + Simple + Simple',
        sentences: [
          { type: 'Simple', hint: 'Second reason', template: 'Another reason is that [idea 2].' },
          { type: 'Simple', hint: 'Explanation', template: 'This means that [explanation].' },
          { type: 'Complex', hint: 'Counter + rebuttal', template: 'Although some people argue that [opposite view], I believe this is less convincing because [reason].' },
          { type: 'Simple', hint: 'Example', template: 'For instance, [example].' },
          { type: 'Simple', hint: 'Link to opinion', template: 'As a result, [link to opinion].' },
        ],
      },
      {
        section: 'Conclusion',
        pattern: '2 sentences · Complex + Simple',
        sentences: [
          { type: 'Complex', hint: 'Restate position', template: 'In conclusion, while some people may support the opposite view, I still strongly agree/disagree that [topic].' },
          { type: 'Simple', hint: 'Final reason', template: 'This is because it leads to more positive and practical outcomes.' },
        ],
      },
    ],
  },
];

export function substituteTemplate(text: string, topic: string): string {
  const cap = topic ? topic.charAt(0).toUpperCase() + topic.slice(1) : '[Topic]';
  return text
    .replace(/\{topic\}/g, topic || '[topic]')
    .replace(/\{Topic\}/g, cap);
}

export function buildParagraphText(para: ParagraphDef, topic: string): string {
  return para.sentences.map(s => substituteTemplate(s.template, topic)).join(' ');
}

export function getEssayType(id: EssayTypeId): EssayTypeDef {
  return ESSAY_TYPES.find(t => t.id === id)!;
}
