'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DeleteAccountButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const router = useRouter()

  const handleDeleteAccount = async () => {
    if (!isConfirming) {
      // 1回目のクリックで確認状態に
      setIsConfirming(true)
      return
    }

    // 2回目のクリックで実行
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '削除に失敗しました')
      }

      // ログアウトしてトップへ
      const supabase = createClient()
      router.push('/')
      await supabase.auth.signOut({ scope: 'local' })

    } catch (err) {
      console.error(err)
      alert('アカウントの削除に失敗しました。もう一度お試しください。')
      setIsConfirming(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsConfirming(false)
  }

  if (isConfirming) {
    return (
      <div>
        <p>本当に削除しますか？この操作は取り消せません。</p>
        <button onClick={handleDeleteAccount} disabled={isLoading}>
          {isLoading ? '削除中...' : 'はい、削除する'}
        </button>
        <button onClick={handleCancel} disabled={isLoading}>
          キャンセル
        </button>
      </div>
    )
  }

  return (
    <button onClick={handleDeleteAccount}>
      アカウントを削除する
    </button>
  )
}