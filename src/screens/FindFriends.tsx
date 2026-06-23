import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, UserPlus } from '@phosphor-icons/react'
import { api } from '../api/client'
import { usePalate } from '../providers/PalateProvider'
import { Avatar, Button } from '../components/ui'
import { AppBar, Screen } from '../components/layout'

interface UserRow {
  id: string
  name: string
  avatarSeed: string
}

interface PendingRequest {
  id: string
  fromUserId: string
  fromName: string | null
  createdAt: string
}

interface SentRequest {
  id: string
  toUserId: string
  toName: string | null
  status: string
}

export default function FindFriends() {
  const navigate = useNavigate()
  const { friends } = usePalate()
  const [users, setUsers] = useState<UserRow[]>([])
  const [pending, setPending] = useState<PendingRequest[]>([])
  const [sent, setSent] = useState<SentRequest[]>([])
  const [loading, setLoading] = useState(true)

  const friendIds = new Set(friends.map((f) => f.id))
  const sentToIds = new Set(sent.filter((s) => s.status === 'pending').map((s) => s.toUserId))

  const load = async () => {
    setLoading(true)
    try {
      const [allUsers, pendingReqs, sentReqs] = await Promise.all([
        api.listUsers(),
        api.getPendingFriendRequests(),
        api.getSentFriendRequests(),
      ])
      setUsers(allUsers)
      setPending(pendingReqs)
      setSent(sentReqs)
    } catch (e) {
      console.error('Failed to load users:', e)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSendRequest = async (toUserId: string) => {
    try {
      await api.sendFriendRequest(toUserId)
      await load()
    } catch (e) {
      console.error(e)
    }
  }

  const handleAccept = async (id: string) => {
    try {
      await api.acceptFriendRequest(id)
      await load()
    } catch (e) {
      console.error(e)
    }
  }

  const handleReject = async (id: string) => {
    try {
      await api.rejectFriendRequest(id)
      await load()
    } catch (e) {
      console.error(e)
    }
  }

  const otherUsers = users.filter((u) => !friendIds.has(u.id))

  return (
    <Screen
      appBar={
        <AppBar
          title="Find Friends"
          left={
            <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-ctl text-ink-soft transition hover:bg-surface-2 active:scale-90">
              <ArrowLeft size={20} />
            </button>
          }
        />
      }
    >
      <div className="px-4 pb-6 pt-3 lg:mx-auto lg:max-w-2xl lg:px-8 lg:pt-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-ember" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending requests section */}
            {pending.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold text-ink">Pending Requests</h2>
                <div className="space-y-2.5">
                  {pending.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
                      <Avatar seed={r.fromName ?? 'default'} name={r.fromName ?? 'Unknown'} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold text-ink">{r.fromName ?? 'Unknown'}</div>
                        <div className="text-[12px] text-ink-soft">Wants to be friends</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(r.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 active:scale-90"
                        >
                          <Check size={18} weight="bold" />
                        </button>
                        <button
                          onClick={() => handleReject(r.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-200 active:scale-90"
                        >
                          <X size={18} weight="bold" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* All users */}
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">
                {otherUsers.length > 0 ? 'People on Palate' : 'No other users yet'}
              </h2>
              {otherUsers.length === 0 && (
                <p className="text-center text-[13px] text-ink-soft py-8">
                  Invite friends to join Palate!
                </p>
              )}
              <div className="space-y-2.5">
                {otherUsers.map((u) => {
                  const sentRequest = sentToIds.has(u.id)
                  const requestId = sent.find((s) => s.toUserId === u.id && s.status === 'pending')?.id
                  return (
                    <div key={u.id} className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
                      <Avatar seed={u.avatarSeed} name={u.name} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold text-ink">{u.name}</div>
                      </div>
                      {sentRequest ? (
                        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[12px] font-medium text-amber-700">
                          Requested
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(u.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-ember px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-ember-dark active:scale-95"
                        >
                          <UserPlus size={14} />
                          Add Friend
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </Screen>
  )
}
