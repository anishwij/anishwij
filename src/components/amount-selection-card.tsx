'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem as RadioGroupItemImpl } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { FormEvent } from 'react'

function RadioGroupItem({ value }: { value: string }) {
  return (
    <div className='flex items-center gap-3'>
      <RadioGroupItemImpl id={`r${value}`} value={value} />
      <Label htmlFor={`r${value}`}>{`$${value}`}</Label>
    </div>
  )
}

function AmountForm() {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const amount = formData.get('amount') as '10' | '25' | '50' | '100'

    console.log(amount)
  }
  return (
    <form onSubmit={handleSubmit} className='space-y-2'>
      <RadioGroup name='amount' defaultValue='10'>
        <RadioGroupItem value='10' />
        <RadioGroupItem value='25' />
        <RadioGroupItem value='50' />
        <RadioGroupItem value='100' />
      </RadioGroup>
      <Button type='submit'>Donate</Button>
    </form>
  )
}

export function AmountSelectionCard({ className }: { className?: string }) {
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>Amount Selection Form</CardTitle>
      </CardHeader>
      <CardContent>
        <AmountForm />
      </CardContent>
    </Card>
  )
}
