export const postCategoryOptions = [
  {
    value: "CONFESSION",
    label: "Confession",
    description: "Anonymous truths, half-serious confessions, and office secrets.",
  },
  {
    value: "UNPOPULAR_OPINION",
    label: "Unpopular Opinion",
    description: "Hot takes about engineering, meetings, or team rituals.",
  },
  {
    value: "FUNNY_MOMENT",
    label: "Funny Moment",
    description: "Memorable bugs, cursed demos, and accidental comedy.",
  },
  {
    value: "WORK_STRUGGLE",
    label: "Work Struggle",
    description: "Deadlines, confusing emails, and survival-mode engineering.",
  },
  {
    value: "SECRET_WIN",
    label: "Secret Win",
    description: "Quiet victories that deserve recognition without the spotlight.",
  },
  {
    value: "RANDOM_THOUGHT",
    label: "Random Thought",
    description: "Short office shower thoughts and developer observations.",
  },
  {
    value: "SUGGESTION",
    label: "Suggestion",
    description: "Ideas for better culture, smoother work, and less chaos.",
  },
  {
    value: "MEME",
    label: "Meme",
    description: "GIF-powered reactions to shipping, meetings, and production fires.",
  },
  {
    value: "POLL",
    label: "Poll",
    description: "Fast anonymous voting with percentages and office gossip energy.",
  },
] as const;

export const reactionOptions = [
  { value: "LAUGH", emoji: "😂", label: "Laugh" },
  { value: "SKULL", emoji: "💀", label: "Dead" },
  { value: "FIRE", emoji: "🔥", label: "Hot" },
  { value: "COFFEE", emoji: "☕", label: "Coffee" },
  { value: "MELTING", emoji: "🫠", label: "Melting" },
  { value: "BRAIN", emoji: "🧠", label: "Big brain" },
  { value: "SAME_BRO", emoji: "🤝", label: "Same bro" },
  { value: "LEGEND", emoji: "🏆", label: "Legend" },
] as const;

export const recoveryQuestionBank = [
  { key: "mother-nickname", label: "What is your mother's nickname?" },
  { key: "birth-city", label: "Which city were you born in?" },
  { key: "best-friend", label: "What is your best friend's nickname?" },
  { key: "ssc-school", label: "What was your SSC school name?" },
  { key: "street-food", label: "What is your favorite street food?" },
] as const;

export const usernameSuggestions = [
  "ghoststack",
  "nullbiryani",
  "deploygremlin",
  "darkloop",
  "silentcommit",
  "midnightmerge",
  "bugmonger",
  "coffeecache",
  "stackwhisper",
  "rootrumor",
] as const;

export const defaultTags = [
  "meeting",
  "manager",
  "canteen",
  "buglife",
  "salaryweek",
  "remote-work",
  "deploy",
  "standup",
  "afterhours",
  "office-tea",
] as const;

export const dailyPrompts = [
  "What ruined your day?",
  "Biggest fake smile today?",
  "Most confusing email this week?",
  "What made you laugh in the office?",
  "Which meeting should have been a README?",
  "What silently annoyed you today?",
] as const;

export const quizSeedQuestions = [
  {
    slug: "cto-first-letter",
    prompt: "The last CTO name first letter later",
    explanation: "Internal office knowledge check.",
    options: [
      { label: "A", isCorrect: false },
      { label: "E", isCorrect: false },
      { label: "M", isCorrect: true },
    ],
  },
  {
    slug: "home-office-person-first-letter",
    prompt: "The first later of the people who do more home office",
    explanation: "Internal office knowledge check.",
    options: [
      { label: "A", isCorrect: true },
      { label: "T", isCorrect: false },
      { label: "M", isCorrect: false },
    ],
  },
  {
    slug: "active-branches-bangladesh",
    prompt: "How many branch in bangladesh we have currently active",
    explanation: "Internal office knowledge check.",
    options: [
      { label: "3", isCorrect: true },
      { label: "1", isCorrect: false },
      { label: "5", isCorrect: false },
    ],
  },
  {
    slug: "is-azad-married",
    prompt: "Is azad marrid?",
    explanation: "Internal office knowledge check.",
    options: [
      { label: "Yes", isCorrect: true },
      { label: "No", isCorrect: false },
    ],
  },
] as const;
