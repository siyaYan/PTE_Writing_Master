export interface Topic {
  id: string;
  cat: string;
  title: string;
  desc: string;
}

export const PTE_TOPICS: Topic[] = [
  { id: "T01", cat: "Technology", title: "Social media & society", desc: "Effects of social platforms on relationships, attention, and well-being." },
  { id: "T02", cat: "Technology", title: "AI at work", desc: "Benefits and risks of automation/AI on jobs and productivity." },
  { id: "T03", cat: "Technology", title: "Online learning", desc: "E-learning vs classroom education in outcomes and access." },
  { id: "T04", cat: "Technology", title: "Data privacy", desc: "How far companies/governments should go in collecting personal data." },
  { id: "T05", cat: "Technology", title: "Digital divide", desc: "Inequality created by uneven access to technology and internet." },
  { id: "T06", cat: "Technology", title: "Remote work", desc: "Impact of work-from-home on efficiency, team culture, and cities." },
  { id: "T07", cat: "Technology", title: "Video games", desc: "Do games harm or help learning, creativity, and social skills?" },
  { id: "T08", cat: "Technology", title: "Cashless society", desc: "Pros/cons of removing physical cash and using digital payments only." },
  { id: "E01", cat: "Environment", title: "Climate change action", desc: "Should governments prioritize climate policy over short-term growth?" },
  { id: "E02", cat: "Environment", title: "Plastic waste", desc: "Bans, taxes, or education—what best reduces single-use plastics?" },
  { id: "E03", cat: "Environment", title: "Renewable energy", desc: "Transition costs and benefits of wind/solar vs fossil fuels." },
  { id: "E04", cat: "Environment", title: "Public transport", desc: "Investing in mass transit to cut congestion and emissions." },
  { id: "E05", cat: "Environment", title: "Wildlife protection", desc: "Balancing development with biodiversity conservation." },
  { id: "ED1", cat: "Education", title: "Exams vs. skills", desc: "Are high-stakes tests the best way to measure learning?" },
  { id: "ED2", cat: "Education", title: "Homework load", desc: "Should schools reduce homework to protect mental health?" },
  { id: "ED3", cat: "Education", title: "University access", desc: "Tuition subsidies vs free college—what’s fair and effective?" },
  { id: "ED4", cat: "Education", title: "Gap year", desc: "Does a year off before university help or harm students?" },
  { id: "ED5", cat: "Education", title: "STEM vs arts", desc: "Funding priorities between science/tech and arts/humanities." },
  { id: "H01", cat: "Health", title: "Processed food & obesity", desc: "Should governments regulate sugar/salt to fight obesity?" },
  { id: "H02", cat: "Health", title: "Sports in school", desc: "Role of compulsory sport in physical and social development." },
  { id: "H03", cat: "Health", title: "Mental health stigma", desc: "Raising awareness vs policy—what most improves outcomes?" },
  { id: "H04", cat: "Health", title: "Work–life balance", desc: "Four-day week and flexible hours: productivity vs cost." },
  { id: "EC1", cat: "Economy", title: "Globalization", desc: "Impact of global trade on jobs, culture, and inequality." },
  { id: "EC2", cat: "Economy", title: "Tourism boom", desc: "Do benefits of mass tourism outweigh environmental/cultural costs?" },
  { id: "EC3", cat: "Economy", title: "Gig economy", desc: "Freedom vs insecurity in freelance/app-based work." },
  { id: "EC4", cat: "Economy", title: "Advertising ethics", desc: "Should ads to children or for junk food be restricted?" },
  { id: "S01", cat: "Society", title: "Freedom of speech", desc: "Limits of expression when it causes harm or misinformation." },
  { id: "S02", cat: "Society", title: "Gender equality", desc: "Are quotas necessary to close gaps in leadership?" },
  { id: "S03", cat: "Society", title: "Animal testing", desc: "Do medical benefits justify testing on animals?" },
  { id: "S04", cat: "Society", title: "Cultural heritage", desc: "Preserving traditions vs adapting to modern values." },
  { id: "U01", cat: "Urban", title: "City vs countryside", desc: "Is urban living better for career and lifestyle than rural life?" },
  { id: "U02", cat: "Urban", title: "Housing affordability", desc: "Government interventions to make housing more affordable." },
  { id: "U03", cat: "Urban", title: "Smart cities", desc: "Sensors and data to improve services—privacy and equity issues." },
  { id: "M01", cat: "Media", title: "Fake news", desc: "Who should police misinformation—platforms or governments?" },
  { id: "M02", cat: "Media", title: "Celebrity culture", desc: "Should celebrities be role models? Effects on youth values." },
  { id: "SC1", cat: "Science", title: "Space exploration", desc: "Is space spending justified given Earth’s urgent problems?" },
  { id: "SC2", cat: "Science", title: "Genetic engineering", desc: "CRISPR on crops/humans—promise and ethical concerns." },
  { id: "P01", cat: "Policy", title: "Universal basic income", desc: "Would UBI reduce poverty or discourage work?" },
  { id: "P02", cat: "Policy", title: "Mandatory volunteering", desc: "Should schools require community service hours?" },
  { id: "P03", cat: "Policy", title: "Crime & punishment", desc: "Rehabilitation vs deterrence for non-violent crimes." },
  { id: "WE1", cat: "Work/Edu", title: "Internships", desc: "Paid vs unpaid internships—access and fairness." },
  { id: "WE2", cat: "Work/Edu", title: "Soft skills", desc: "Should schools assess communication, teamwork, resilience?" }
];

export const CAT_GRADS: [string, string][] = [
  ["#fdf2f8", "#fce7f3"], // pink
  ["#ecfeff", "#cffafe"], // cyan
  ["#eef2ff", "#e0e7ff"], // indigo
  ["#fef3c7", "#fde68a"], // amber
  ["#dcfce7", "#bbf7d0"], // green
  ["#e0f2fe", "#bae6fd"], // sky
  ["#fae8ff", "#f5d0fe"], // purple
  ["#fee2e2", "#fecaca"], // red
];
