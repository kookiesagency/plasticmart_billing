'use client'

import { useRef } from 'react'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CategoryManager, { CategoryManagerRef } from './category-manager'
import { SetHeader } from '@/components/layout/header-context'

export default function CategoriesPage() {
  const managerRef = useRef<CategoryManagerRef>(null)

  return (
    <>
      <SetHeader
        title="Item Categories"
        actions={
          <Button onClick={() => managerRef.current?.openCreateDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Category
          </Button>
        }
      />
      <CategoryManager ref={managerRef} />
    </>
  )
}
