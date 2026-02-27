"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { getSupabase } from "@/lib/supabase"
import { Loader2, Trophy, Medal } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import type { VoteeResult, VoteWithUsers } from "@/types/voting"
import { sessions } from "@/app/actions/index"

const medals = [
  { icon: Trophy, color: "text-yellow-500", border: "border-yellow-500" },
  { icon: Medal, color: "text-gray-400", border: "border-gray-400" },
  { icon: Medal, color: "text-amber-600", border: "border-amber-600" },
]

const getVotingSessionResults = sessions.getVotingSessionResults

export default function RevealResultsPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allVotees, setAllVotees] = useState<VoteeResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const supabase = getSupabase()

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true)

        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/unauthorized')
          return
        }

        // Get voting session results
        const sessionId = parseInt(params.id as string)
        if (isNaN(sessionId)) {
          throw new Error("Invalid session ID")
        }

        const { data, error: resultsError } = await getVotingSessionResults(sessionId)

        if (resultsError) {
          throw resultsError
        }

        if (!data) {
          throw new Error("No results data returned")
        }

        setAllVotees(data)

        setTimeout(() => setShowResults(true), 500)
      } catch (err) {
        console.error('Error fetching results:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 mb-4"
        >
          ← Back to Sessions
        </Link>
        <h1 className="text-3xl font-bold">
          Voting Results
        </h1>
      </div>

      {allVotees.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No votes were cast in this session.
        </div>
      ) : (
        <>
          {/* Top 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <AnimatePresence>
              {showResults && allVotees.slice(0, 3).map((votee, index) => {
                const MedalIcon = medals[index]?.icon || Trophy
                const medalColor = medals[index]?.color || "text-gray-400"
                const borderColor = medals[index]?.border || ""
                return (
                  <motion.div
                    key={votee.user.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <Card className={`border-2 ${borderColor}`}>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={votee.user.avatar_url} alt={votee.user.name} />
                            <AvatarFallback>{votee.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h2 className="text-xl font-semibold">{votee.user.name}</h2>
                              <MedalIcon className={`h-5 w-5 ${medalColor}`} />
                            </div>
                            <p className="text-muted-foreground">
                              {votee.voteCount} vote{votee.voteCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Voted by</p>
                        <div className="space-y-4">
                          {votee.votes.map((vote: VoteWithUsers) => (
                            <div key={vote.id} className="border-t pt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={vote.voter.avatar_url} alt={vote.voter.name} />
                                  <AvatarFallback>{vote.voter.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{vote.voter.name}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{vote.reason}</p>
                              {vote.value && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                    {vote.value}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Remaining votees */}
          {allVotees.length > 3 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">Other Votes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {showResults && allVotees.slice(3).map((votee, index) => (
                    <motion.div
                      key={votee.user.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.15 }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={votee.user.avatar_url} alt={votee.user.name} />
                              <AvatarFallback>{votee.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold">{votee.user.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {votee.voteCount} vote{votee.voteCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Voted by</p>
                          <div className="space-y-4">
                            {votee.votes.map((vote: VoteWithUsers) => (
                              <div key={vote.id} className="border-t pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={vote.voter.avatar_url} alt={vote.voter.name} />
                                    <AvatarFallback>{vote.voter.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">{vote.voter.name}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{vote.reason}</p>
                                {vote.value && (
                                  <div className="mt-2">
                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                      {vote.value}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Honorable Mentions */}
          {(() => {
            const honorableMentions = allVotees
              .flatMap(votee => votee.votes)
              .filter(vote => vote.honorable_mentions)
              .map(vote => ({
                id: vote.id,
                voterName: vote.voter.name,
                voterAvatar: vote.voter.avatar_url,
                mentions: vote.honorable_mentions!,
              }))

            if (honorableMentions.length === 0) return null

            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={showResults ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.8 }}
              >
                <h2 className="text-2xl font-semibold mb-6">Honorable Mentions</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {honorableMentions.map((mention) => (
                        <div key={mention.id} className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 mt-0.5">
                            <AvatarImage src={mention.voterAvatar} alt={mention.voterName} />
                            <AvatarFallback>{mention.voterName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-sm font-medium">{mention.voterName}</span>
                            <p className="text-sm text-muted-foreground">{mention.mentions}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })()}
        </>
      )}
    </div>
  )
}
