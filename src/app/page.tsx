import { MaxWidthWrapper } from '@/components/max-width-wrapper'

export default function Home() {
  return (
    <div>
      <section>
        <MaxWidthWrapper className='py-12'>
          <div className='flex flex-col justify-center items-center min-h-[70svh]'>
            <div className='flex flex-col gap-4 mx-auto max-w-100'>
              <div>Test</div>
            </div>
          </div>
        </MaxWidthWrapper>
      </section>
    </div>
  )
}
