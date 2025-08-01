import { Card, CardContent } from '@/components/ui/card'
import { redis } from '@/lib/redis.server'
import { cookies } from 'next/headers'

export async function CampaignInfoCard() {
  const sessionId = (await cookies()).get('sessionId')?.value as string
  const utm_source = (await redis.hget(sessionId, 'utm_source')) as string

  return (
    <Card>
      <CardContent>
        <div className='flex flex-col gap-2'>
          <p>{sessionId.slice(5)}</p>
          <p>{utm_source ? utm_source : ''}</p>
        </div>
      </CardContent>
    </Card>
  )
}
