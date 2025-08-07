'use client'

import { Button } from '@/components/ui/button'

export function GTMButton({ ...props }) {
  return (
    <Button
      onClick={() => {
        window.dataLayer!.push({
          event: 'test_button_click',
        })
      }}
      {...props}
    />
  )
}
