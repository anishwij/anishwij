import { AmountSelectionCard } from '@/components/amount-selection-card'
import { GTMButton } from '@/components/gtm-button'
import { MaxWidthWrapper } from '@/components/max-width-wrapper'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function Home() {
  return (
    <div>
      <section>
        <MaxWidthWrapper className='py-12'>
          <div className='flex flex-col justify-center items-center min-h-[70svh]'>
            <div className='flex flex-col gap-4 w-full'>
              <Button asChild className='w-fit'>
                <Link href={'/about'}>Go To About Page</Link>
              </Button>

              <AmountSelectionCard />
              <Card>
                <CardContent className='flex flex-col gap-2'>
                  Other Stuff
                  <GTMButton>Do Nothing</GTMButton>
                </CardContent>
              </Card>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>
    </div>
  )
}
