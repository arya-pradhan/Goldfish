export const MOTIVATION_TIPS = [
  'If you skip this visit, you could save that money toward an emergency fund.',
  'Even one skipped trip a week compounds significantly over a year.',
  'The best purchase is the one you walk away from.',
  'Future you will thank present you for this moment of restraint.',
  'That money could be working for you in a high-yield savings account.',
  'Every dollar you save today is a dollar with compound interest tomorrow.',
  'You already have everything you need. The fish believes in you.',
  'Impulse purchases fade. Savings accounts grow. Choose growth.',
]

export function getRandomTip(): string {
  return MOTIVATION_TIPS[Math.floor(Math.random() * MOTIVATION_TIPS.length)]
}
