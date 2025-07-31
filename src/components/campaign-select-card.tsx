import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { nanoid } from 'nanoid'
import { redirect } from 'next/navigation'

const campaignRadioConfig = {
  defaultValue: 'linkedin-campaign',
  campaigns: [
    {
      name: 'LinkedIn Campaign',
      value: 'linkedin-campaign',
      utm_source: 'linkedin',
      utm_medium: 'social',
      utm_campaign: 'spring_sale_2024',
      utm_term: 'professional_network',
      utm_content: 'sponsored_post',
    },
    {
      name: 'Social Media Campaign',
      value: 'social-media-campaign',
      utm_source: 'facebook',
      utm_medium: 'social',
      utm_campaign: 'brand_awareness_q1',
      utm_term: 'general_audience',
      utm_content: 'video_ad',
    },
  ],
} as const

type CampaignValue = (typeof campaignRadioConfig.campaigns)[number]['value']
type Campaign = (typeof campaignRadioConfig.campaigns)[number]

const getCampaignData = (campaignName: CampaignValue): Campaign => {
  const campaign = campaignRadioConfig.campaigns.find((campaign) => campaign.value === campaignName)
  return campaign!
}

const createSessionId = () => `sess:${nanoid(21)}`

export function CampaignSelectCard() {
  const handleSubmit = async (formData: FormData) => {
    'use server'
    const selectedCampaign = formData.get('campaign') as CampaignValue
    const { utm_campaign, utm_source, utm_content, utm_medium, utm_term } =
      getCampaignData(selectedCampaign)

    const sessionId = createSessionId()
    console.log(sessionId)

    const params = new URLSearchParams({
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      session_id: sessionId,
    })

    const campaignURL = `/?${params.toString()}`
    redirect(campaignURL)
  }

  return (
    <Card>
      <CardHeader></CardHeader>
      <CardContent>
        <form className='space-y-4' action={handleSubmit}>
          <RadioGroup name='campaign' defaultValue={campaignRadioConfig.defaultValue}>
            {campaignRadioConfig.campaigns.map(({ value, name }, index) => (
              <div className='inline-flex gap-2' key={index}>
                <RadioGroupItem value={value} id={`r${index}`} />
                <Label htmlFor={`r${index}`}>{name}</Label>
              </div>
            ))}
          </RadioGroup>

          <Button type='submit'>Init UTMs</Button>
        </form>
      </CardContent>
    </Card>
  )
}
