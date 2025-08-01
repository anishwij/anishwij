import { Card, CardContent } from '@/components/ui/card'
import { redis } from '@/lib/redis.server'
import { cookies } from 'next/headers'

export async function CampaignInfoCard() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('sessionId')?.value

  if (!sessionId) {
    return (
      <Card>
        <CardContent>
          <p>No session found</p>
        </CardContent>
      </Card>
    )
  }

  const sessionData = await redis.hgetall(sessionId)

  return (
    <Card>
      <CardContent>
        <div className='flex flex-col gap-2'>
          <p className='font-mono text-xs'>Session: {sessionId.slice(5)}</p>
          <pre className='text-xs overflow-auto'>{JSON.stringify(sessionData, null, 2)}</pre>
        </div>
      </CardContent>
    </Card>
  )
}
