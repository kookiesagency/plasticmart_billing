'use client'

import { useRef } from 'react'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CategoryManager, { CategoryManagerRef } from './category-manager'
import { SetHeader } from '@/components/layout/header-context'
import { useTranslations } from 'next-intl'

export default function CategoriesPage() {
  const t = useTranslations('categories')
  const managerRef = useRef<CategoryManagerRef>(null)

  return (
    <>
      <SetHeader
        title={t('title')}
        actions={
          <Button onClick={() => managerRef.current?.openCreateDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('createCategory')}
          </Button>
        }
      />
      <CategoryManager ref={managerRef} />
    </>
  )
}
