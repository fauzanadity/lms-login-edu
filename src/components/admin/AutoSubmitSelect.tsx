'use client'

import React from 'react'

interface AutoSubmitSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

export default function AutoSubmitSelect({ children, ...props }: AutoSubmitSelectProps) {
  return (
    <select
      {...props}
      onChange={(e) => {
        e.target.form?.submit()
        if (props.onChange) {
          props.onChange(e)
        }
      }}
    >
      {children}
    </select>
  )
}
