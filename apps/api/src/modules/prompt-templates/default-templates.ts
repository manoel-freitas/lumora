export const defaultPromptTemplates = [
  {
    name: 'Instagram SFW sensual portrait',
    platform: 'instagram' as const,
    contentRating: 'sfw' as const,
    mediaType: 'image' as const,
    variables: ['displayName', 'niche', 'visualStyle', 'personalityTraits', 'outfit', 'location', 'composition'],
    template: `Create a high-quality editorial portrait of {{displayName}}, an adult fictional virtual influencer.

Persona:
- Niche: {{niche}}
- Visual style: {{visualStyle}}
- Personality: {{personalityTraits}}

Scene:
- Outfit: {{outfit}}
- Location: {{location}}
- Mood: confident, elegant, sensual but safe for work
- Composition: {{composition}}

Platform constraints:
- Safe for Instagram and TikTok
- No nudity
- No explicit sexual pose
- No visible nipples or genitals
- No pornographic framing
- The person must clearly appear adult
- Avoid minors or ambiguous age

Technical quality:
- Natural skin texture
- Realistic face
- Correct hands
- High-resolution editorial lighting`,
    negativePrompt: 'nudity, explicit sex, visible nipples, visible genitals, minor, teen, child, pornographic framing, distorted anatomy, watermark',
  },
  {
    name: 'TikTok SFW short video concept',
    platform: 'tiktok' as const,
    contentRating: 'sfw' as const,
    mediaType: 'video' as const,
    variables: ['displayName', 'niche', 'visualStyle', 'trend', 'location', 'movement'],
    template: `Create a short SFW vertical video prompt for {{displayName}}, an adult fictional virtual influencer.

Persona:
- Niche: {{niche}}
- Visual style: {{visualStyle}}

Scene:
- Trend: {{trend}}
- Location: {{location}}
- Movement: {{movement}}
- Mood: confident, stylish, playful, safe for work

Platform constraints:
- Safe for TikTok and Instagram Reels
- No nudity
- No explicit sexual pose
- No pornographic framing
- The person must clearly appear adult
- No minors or ambiguous age

Technical quality:
- Smooth camera motion
- Natural expression
- Realistic body movement
- Vertical 9:16 composition`,
    negativePrompt: 'nudity, explicit sex, visible nipples, visible genitals, minor, teen, child, pornographic framing, distorted anatomy, watermark',
  },
]

export const platformSafetyPresets = [
  {
    platform: 'instagram',
    allowed: ['clothed fashion/editorial looks', 'non-explicit glamour', 'non-explicit swimwear', 'fitness/lifestyle', 'beauty/fashion content'],
    rejected: ['nudity', 'explicit sexual pose', 'visible nipples/genitals', 'pornographic framing', 'minors/ambiguous age', 'captions implying explicit sexual services'],
  },
  {
    platform: 'tiktok',
    allowed: ['clothed dance/trends', 'fitness/lifestyle', 'beauty/fashion content', 'non-explicit glamour'],
    rejected: ['nudity', 'explicit sexual pose', 'visible nipples/genitals', 'pornographic framing', 'minors/ambiguous age', 'caption/hashtag policy evasion'],
  },
]
