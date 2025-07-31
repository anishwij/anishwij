import { CampaignInfoCard } from '@/components/campaign-info-card'
import { CampaignSelectCard } from '@/components/campaign-select-card'
import { MaxWidthWrapper } from '@/components/max-width-wrapper'

export default function Home() {
  return (
    <div>
      <section>
        <MaxWidthWrapper className='py-12'>
          <div className='flex flex-col justify-center items-center min-h-[70svh]'>
            <CampaignSelectCard />
            <CampaignInfoCard />
          </div>
        </MaxWidthWrapper>
      </section>
    </div>
  )
}
