export const GUILT_LINES: Array<{ caption: (zone: string, amount: number) => string }> = [
  { caption: (zone, amount) => `You've spent $${amount} at ${zone}. The fish is judging you.` },
  { caption: (zone, amount) => `Another visit to ${zone}? Your future self is crying. That's $${amount} gone.` },
  { caption: (zone, amount) => `${zone} has claimed $${amount} of your money. Swim. Away.` },
  { caption: (zone, amount) => `$${amount} at ${zone}. The fish remembers. The fish never forgets.` },
  { caption: (zone, amount) => `You're about to donate $${amount} to ${zone} again. Are you sure about this?` },
  { caption: (zone, amount) => `The goldfish saw you enter ${zone}. It has seen this $${amount} mistake before.` },
  { caption: (zone, amount) => `${zone}: $${amount} of your dreams, gone. The fish weeps silently.` },
  { caption: (zone, amount) => `$${amount} spent here before. ${zone} knows your weakness. So does the fish.` },
  { caption: (zone, amount) => `Entering ${zone} again? That's $${amount} in historical damage. The fish cries.` },
  { caption: (zone, amount) => `The fish has watched you spend $${amount} at ${zone}. It begs you to reconsider.` },
]

export function getRandomGuiltLine(zone: string, amount: number): string {
  const line = GUILT_LINES[Math.floor(Math.random() * GUILT_LINES.length)]
  return line.caption(zone, amount)
}
