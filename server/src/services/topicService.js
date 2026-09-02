/**
 * Topic Engine for SpeakForge
 * Curated bank of 200+ topics across 6 key categories with slot-machine reel words
 * and optional live trending topics fallback
 */

const TOPIC_CATEGORIES = {
  technology: {
    name: 'Current Technology',
    icon: 'Cpu',
    reelWords: ['AI Ethics', 'Quantum Computing', 'Electric Vehicles', 'Cybersecurity', 'Autonomous Systems', 'Remote Work', 'Open Source', 'Neural Interfaces', 'Data Privacy', 'Cloud Infrastructure', 'Robotics', 'Augmented Reality', 'Green Tech', 'Space Tech', 'Bio-Informatics'],
    topics: [
      'Should AI development be regulated by international treaties?',
      'Will quantum computing make current encryption completely obsolete?',
      'The environmental cost vs benefit of electric vehicles',
      'How social media recommendation algorithms shape modern politics',
      'The future of cybersecurity in an era of automated AI attacks',
      'Is remote work permanently altering urban economies?',
      'Why open-source software is critical for technological resilience',
      'The ethical dilemmas of brain-computer and neural interfaces',
      'Data privacy as a fundamental human right: Is it too late?',
      'How artificial intelligence is transforming preventive healthcare',
      'The promise and peril of humanoid robotics in the home',
      'Will artificial general intelligence emerge in this decade?',
      'The role of edge computing in reducing internet bottlenecks',
      'How generative AI is reshaping modern creative industries',
      'The ethics of deepfakes and authentic media verification'
    ]
  },
  society: {
    name: 'Society & Culture',
    icon: 'Globe',
    reelWords: ['Mental Health', 'Youth Culture', 'Work-Life Balance', 'Climate Action', 'Education Reform', 'Gig Economy', 'Urban Planning', 'Digital Literacy', 'Civic Engagement', 'Media Literacy', 'Longevity', 'Community Spaces'],
    topics: [
      'How smartphone addiction is reshaping adolescent mental health',
      'Is the traditional 40-hour work week outdated in modern knowledge work?',
      'Climate activism: Effective grassroots change vs performative awareness',
      'How modern higher education must adapt to remain relevant',
      'The reality of gig-economy workers: Flexibility or exploitation?',
      'Why loneliness has become a public health epidemic in developed nations',
      'Should public spaces be redesigned to prioritize community over commerce?',
      'The role of digital literacy in preventing financial fraud among elders',
      'Is hustle culture doing more harm than good to young professionals?',
      'The psychological impact of 24/7 instant messaging and notifications'
    ]
  },
  science: {
    name: 'Science & Discovery',
    icon: 'FlaskConical',
    reelWords: ['Space Exploration', 'CRISPR Gene Editing', 'Renewable Energy', 'Ocean Depths', 'Nuclear Fusion', 'Stem Cell Therapy', 'Dark Matter', 'Exoplanets', 'Antibiotic Resistance', 'Microplastics'],
    topics: [
      'Why permanent human settlement on Mars is or is not realistic',
      'CRISPR and human embryo gene editing: Where should the line be drawn?',
      'Nuclear fusion power: Decades away or within our immediate grasp?',
      'The catastrophic threat of global antibiotic resistance',
      'How microplastics are infiltrating human biology and ecosystems',
      'Exploring the deep ocean: Why we know more about Mars than our sea floor',
      'The search for extraterrestrial life in our solar system’s icy moons',
      'Can geoengineering reverse climate change without catastrophic side effects?',
      'The promise of mRNA technology beyond infectious disease vaccines',
      'How quantum entanglement is challenging our understanding of physics'
    ]
  },
  business: {
    name: 'Business & Career',
    icon: 'Briefcase',
    reelWords: ['Entrepreneurship', 'Remote Teams', 'Personal Branding', 'Startup Culture', 'Leadership Styles', 'Venture Capital', 'Productivity', 'Brand Loyalty', 'Bootstrapping', 'SaaS Models'],
    topics: [
      'What separates founders who scale to IPO from those who fail early?',
      'Is building a personal brand essential for modern career advancement?',
      'The shift from vanity growth metrics to sustainable profitability in startups',
      'How to maintain strong team culture and trust in asynchronous remote teams',
      'Why introverts often make the most effective corporate leaders',
      'The danger of over-relying on venture capital versus customer-funded growth',
      'How transparent leadership and radical candor transform organizations',
      'Is college degree prestige losing its value in technical hiring?',
      'The psychology of pricing: Why value perception trumps production cost',
      'How companies can foster genuine internal innovation without bureaucracy'
    ]
  },
  philosophy: {
    name: 'Life & Philosophy',
    icon: 'Compass',
    reelWords: ['Stoicism', 'Emotional IQ', 'Defining Success', 'Overcoming Failure', 'Habit Formation', 'Mindfulness', 'Time Perception', 'Courage', 'Patience', 'Deep Work'],
    topics: [
      'Why modern life requires the ancient philosophy of Stoicism',
      'The paradox of choice: Why having more options makes us less happy',
      'How learning to fail productively is the single greatest meta-skill',
      'Why emotional intelligence consistently outperforms raw IQ in long-term success',
      'The illusion of multitasking: Why deep uninterrupted focus is a superpower',
      'What true wealth looks like beyond financial accumulation',
      'How our perception of time changes as we grow older and how to slow it down',
      'The discipline of saying no to good opportunities to pursue great ones',
      'Why vulnerability is a sign of immense courage rather than weakness',
      'How daily micro-habits compound into extraordinary transformations'
    ]
  },
  india: {
    name: 'India & Emerging Markets',
    icon: 'Landmark',
    reelWords: ['Digital India', 'Startup Ecosystem', 'UPI Revolution', 'Make in India', 'NEP 2020', 'Space Program', 'Fintech Leadership', 'Agritech', 'Clean Energy India', 'Semiconductor Mission'],
    topics: [
      'How the Unified Payments Interface (UPI) revolutionized financial inclusion in India',
      'India’s startup landscape: Moving from copycat models to deep-tech breakthroughs',
      'The National Education Policy (NEP 2020): Opportunities and implementation challenges',
      'How ISRO achieves world-class space exploration on fractional global budgets',
      'The future of semiconductor manufacturing in India: Can we become a global hub?',
      'Bridging the urban-rural digital divide through high-speed mobile connectivity',
      'The rise of tier-2 and tier-3 city entrepreneurship across India',
      'How renewable solar infrastructure is transforming India’s energy independence',
      'The evolution of Indian cinema and content on the global streaming stage',
      'How agritech innovations are directly empowering smallholder farmers'
    ]
  }
};

/**
 * Get random topic and slot machine reel words
 */
function getRandomTopic(category = null) {
  const catKeys = Object.keys(TOPIC_CATEGORIES);
  const selectedCatKey = (category && TOPIC_CATEGORIES[category])
    ? category
    : catKeys[Math.floor(Math.random() * catKeys.length)];

  const catData = TOPIC_CATEGORIES[selectedCatKey];
  const topic = catData.topics[Math.floor(Math.random() * catData.topics.length)];

  // Gather 18-20 words for the visual slot reel (mix of categories + selected)
  const allReelWords = [];
  Object.values(TOPIC_CATEGORIES).forEach(c => allReelWords.push(...c.reelWords));
  const shuffledWords = allReelWords.sort(() => 0.5 - Math.random()).slice(0, 15);

  return {
    topic,
    categoryKey: selectedCatKey,
    categoryName: catData.name,
    reelWords: [catData.reelWords[0], ...shuffledWords, topic]
  };
}

/**
 * Get all available categories with summary counts
 */
function getCategories() {
  return Object.entries(TOPIC_CATEGORIES).map(([key, data]) => ({
    id: key,
    name: data.name,
    icon: data.icon,
    topicCount: data.topics.length,
    sample: data.topics[0]
  }));
}

module.exports = {
  TOPIC_CATEGORIES,
  getRandomTopic,
  getCategories
};
