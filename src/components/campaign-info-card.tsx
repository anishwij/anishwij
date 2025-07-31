import { Card, CardContent } from '@/components/ui/card'
import { redis } from '@/lib/redis.server'
import { cookies } from 'next/headers'

export async function CampaignInfoCard() {
  const sessionId = (await cookies()).get('sessionId')?.value as string
  const value = (await redis.hget(sessionId, 'value')) as string

  return (
    <Card>
      <CardContent>
        <div className='flex flex-col gap-2'>
          <p>{sessionId}</p>
          <p>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
