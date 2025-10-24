"use client"

import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { Alert, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View, StyleSheet } from "react-native"
import { Chess } from "chess.js"
import Layout from "../components/layout/Layout"
import { variantStyles } from "@/app/lib/styles"
import { getPieceComponent } from "../components/game/chessPieces"

type Color = "white" | "black"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

const QUEEN_INITIAL_DECAY_TIME = 25000
const MAJOR_INITIAL_DECAY_TIME = 20000
const DECAY_INCREMENT = 2000

export default function DecayOffline() {
  const router = useRouter()
  const params = useLocalSearchParams<{ baseTime?: string; increment?: string }>()
  const baseTime = useMemo(() => Math.max(0, Number(params.baseTime ?? 180000)), [params.baseTime])
  const increment = useMemo(() => Math.max(0, Number(params.increment ?? 2000)), [params.increment])

  const [game, setGame] = useState(() => new Chess())
  const [fen, setFen] = useState(game.fen())
  const [activeColor, setActiveColor] = useState<Color>('white')
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<string[]>([])
  const [moveHistory, setMoveHistory] = useState<any[]>([])
  const [captured, setCaptured] = useState<{ white: string[]; black: string[] }>({ white: [], black: [] })
  const [showMoveHistory, setShowMoveHistory] = useState(false)
  const [promotionModal, setPromotionModal] = useState<{ visible: boolean; from: string; to: string; options: string[] } | null>(null)
  const [boardFlipped, setBoardFlipped] = useState(false)

  const [timers, setTimers] = useState<{ white: number; black: number }>({ white: baseTime, black: baseTime })
  const [gameEnded, setGameEnded] = useState(false)
  const [resultMessage, setResultMessage] = useState<string>("")
  const [winner, setWinner] = useState<Color | null>(null)

  // Decay state
  const [queenDecay, setQueenDecay] = useState<{ white: { active: boolean; frozen: boolean; timeRemaining: number; square?: string; count: number }, black: { active: boolean; frozen: boolean; timeRemaining: number; square?: string; count: number } }>({
    white: { active: false, frozen: false, timeRemaining: 0, count: 0 },
    black: { active: false, frozen: false, timeRemaining: 0, count: 0 },
  })
  const [majorDecay, setMajorDecay] = useState<{ active: boolean; frozen: boolean; timeRemaining: number; square?: string; pieceType?: string; color?: Color; count: number }>({ active: false, frozen: false, timeRemaining: 0, count: 0 })
  const [frozenSquares, setFrozenSquares] = useState<{ white: string[]; black: string[] }>({ white: [], black: [] })

  const turnStartRef = useRef<number>(Date.now())
  const lastTickRef = useRef<number>(Date.now())
  const intervalRef = useRef<any>(null)

  // Responsive
  const screenWidth = Dimensions.get("window").width
  const screenHeight = Dimensions.get("window").height
  const isTablet = Math.min(screenWidth, screenHeight) > 600
  const isSmallScreen = screenWidth < 380
  const horizontalPadding = isSmallScreen ? 8 : isTablet ? 20 : 12
  const boardSize = screenWidth - horizontalPadding * 2
  const squareSize = boardSize / 8
  const coordinateFontSize = isSmallScreen ? 8 : 10

  useEffect(() => {
    lastTickRef.current = Date.now()
    turnStartRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      if (gameEnded) return
      const now = Date.now()
      const delta = now - lastTickRef.current
      lastTickRef.current = now

      // main timers
      setTimers((prev) => {
        const next = { ...prev }
        const c = activeColor
        next[c] = Math.max(0, next[c] - delta)
        if (next[c] <= 0 && !gameEnded) endGame('timeout', c === 'white' ? 'black' : 'white', `${capitalize(c)} ran out of time`)
        return next
      })

      // decay timers counting for current player
      setQueenDecay((prev) => {
        const next = { ...prev }
        const q = next[activeColor]
        if (q.active && !q.frozen) {
          q.timeRemaining = Math.max(0, q.timeRemaining - delta)
          if (q.timeRemaining <= 0) {
            q.frozen = true
            q.active = false
            if (q.square) setFrozenSquares((fs) => ({ ...fs, [activeColor]: [...fs[activeColor], q.square!] }))
          }
        }
        return next
      })

      setMajorDecay((prev) => {
        const next = { ...prev }
        if (next.active && !next.frozen && next.color === activeColor) {
          next.timeRemaining = Math.max(0, next.timeRemaining - delta)
          if (next.timeRemaining <= 0) {
            next.frozen = true
            next.active = false
            if (next.square && next.color) setFrozenSquares((fs) => ({ ...fs, [next.color!]: [...fs[next.color!], next.square!] }))
          }
        }
        return next
      })
    }, 250)

    return () => intervalRef.current && clearInterval(intervalRef.current)
  }, [activeColor, gameEnded])

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  const endGame = (result: string, winnerColor: Color | null, reason: string) => {
    setGameEnded(true)
    setWinner(winnerColor)
    if (intervalRef.current) clearInterval(intervalRef.current)
    let msg = ''
    if (result === 'checkmate') msg = winnerColor ? `Checkmate! ${capitalize(winnerColor)} wins.` : 'Checkmate.'
    else if (result === 'timeout') msg = reason || 'Time expired.'
    else if (result === 'draw') msg = reason || 'Draw.'
    else msg = result
    setResultMessage(msg)
  }

  const getPieceAt = (square: string): string | null => {
    const fileIndex = FILES.indexOf(square[0])
    const rankIndex = RANKS.indexOf(square[1])
    if (fileIndex === -1 || rankIndex === -1) return null
    const piecePlacement = fen.split(" ")[0]
    const rows = piecePlacement.split("/")
    if (rows.length !== 8) return null
    const row = rows[rankIndex]
    let col = 0
    for (let i = 0; i < row.length; i++) {
      const c = row[i]
      if (c >= '1' && c <= '8') col += Number.parseInt(c)
      else { if (col === fileIndex) return c; col++ }
    }
    return null
  }

  const isPieceOwnedBy = (piece: string, color: Color) => color === 'white' ? piece === piece.toUpperCase() : piece === piece.toLowerCase()

  const isMajor = (t: string) => ['r','n','b'].includes(t.toLowerCase())

  const shouldPromote = (from: string, to: string) => {
    const piece = getPieceAt(from)
    if (!piece) return false
    if (piece.toLowerCase() !== 'p') return false
    if (activeColor === 'white' && to[1] === '8') return true
    if (activeColor === 'black' && to[1] === '1') return true
    return false
  }

  const handleSquarePress = (square: string) => {
    if (gameEnded) return
    if (selectedSquare === square) { setSelectedSquare(null); setPossibleMoves([]); return }
    if (selectedSquare && possibleMoves.includes(square)) {
      const promoting = shouldPromote(selectedSquare, square)
      if (promoting) { setPromotionModal({ visible: true, from: selectedSquare, to: square, options: ['q','r','b','n'] }); return }
      applyMove({ from: selectedSquare, to: square })
      setSelectedSquare(null); setPossibleMoves([]); return
    }
    const piece = getPieceAt(square)
    if (piece && isPieceOwnedBy(piece, activeColor)) {
      // cannot select frozen
      if (frozenSquares[activeColor].includes(square)) { Alert.alert('Frozen', 'This piece is frozen by decay.'); return }
      setSelectedSquare(square)
      try { const moves = game.moves({ square, verbose: true }) as any[]; setPossibleMoves(moves.map((m) => m.to)) } catch { setPossibleMoves([]) }
    } else { setSelectedSquare(null); setPossibleMoves([]) }
  }

  const applyMove = (m: { from: string; to: string; promotion?: string }) => {
    if (gameEnded) return
    // Block moving frozen piece
    if (frozenSquares[activeColor].includes(m.from)) { Alert.alert('Frozen', 'This piece cannot move.'); return }

    const now = Date.now()
    const elapsed = now - turnStartRef.current
    setTimers((prev) => { const next = { ...prev }; next[activeColor] = Math.max(0, next[activeColor] - elapsed); return next })

    const newGame = new Chess(game.fen())
    const targetPiece = newGame.get(m.to)
    let result
    try { result = newGame.move(m) } catch { Alert.alert('Invalid move', 'This move is not legal.'); return }
    if (!result) { Alert.alert('Invalid move', 'This move is not legal.'); return }

    // Capture track
    if (targetPiece) {
      const capType = targetPiece.type
      setCaptured((prev) => ({ ...prev, [activeColor]: [...prev[activeColor], capType] }))
    }

    // Handle decay triggers
    const movedFrom = m.from
    const piece = result.piece as string
    const movedTo = m.to
    setQueenDecay((prev) => {
      const next = { ...prev }
      const q = next[activeColor]
      if (piece.toLowerCase() === 'q') {
        if (!q.active && !q.frozen) {
          q.active = true; q.timeRemaining = QUEEN_INITIAL_DECAY_TIME; q.square = movedTo; q.count = 1
        } else if (q.active && !q.frozen) {
          q.count += 1; q.timeRemaining = Math.min(QUEEN_INITIAL_DECAY_TIME, q.timeRemaining + DECAY_INCREMENT); q.square = movedTo
        }
      }
      return next
    })

    setMajorDecay((prev) => {
      const next = { ...prev }
      // if queen frozen and no current major active/frozen, start on this major move
      const q = queenDecay[activeColor]
      if (isMajor(piece) && q.frozen) {
        if (!next.active && !next.frozen) {
          next.active = true; next.timeRemaining = MAJOR_INITIAL_DECAY_TIME; next.square = movedTo; next.pieceType = piece; next.count = 1; next.color = activeColor
        } else if (next.active && !next.frozen) {
          // If same piece moves, increment timer; else ignore (only one major decays at a time)
          if (next.square === movedFrom && next.pieceType === piece) {
            next.count += 1; next.timeRemaining = Math.min(MAJOR_INITIAL_DECAY_TIME, next.timeRemaining + DECAY_INCREMENT); next.square = movedTo
          }
        }
      } else if (next.active && !next.frozen) {
        // If decaying piece no longer exists at its square (captured or moved illegally), clear
        const checkGame = new Chess(newGame.fen())
        const p = checkGame.get(next.square!)
        if (!p || p.type !== (next.pieceType as any) || (next.color === 'white' ? p.color !== 'w' : p.color !== 'b')) {
          next.active = false; next.timeRemaining = 0; next.square = undefined; next.pieceType = undefined; next.count = 0; next.color = undefined
        }
      }
      return next
    })

    // Increment post-move
    if (increment > 0) setTimers((prev) => ({ ...prev, [activeColor]: prev[activeColor] + increment }))

    // Commit
    setMoveHistory((prev) => [...prev, result])
    setGame(newGame)
    setFen(newGame.fen())
    const nextColor: Color = activeColor === 'white' ? 'black' : 'white'
    setActiveColor(nextColor)
    setSelectedSquare(null)
    setPossibleMoves([])
    turnStartRef.current = Date.now()

    // End conditions
    if (newGame.isCheckmate()) return endGame('checkmate', nextColor === 'white' ? 'black' : 'white', 'Checkmate')
    if (newGame.isDraw()) return endGame('draw', null, 'Draw')
    if (newGame.isStalemate()) return endGame('draw', null, 'Stalemate')
  }

  const handlePromotionSelect = (p: string) => {
    if (!promotionModal) return
    applyMove({ from: promotionModal.from, to: promotionModal.to, promotion: p })
    setPromotionModal(null)
  }

  const renderSquare = (file: string, rank: string) => {
    const square = `${file}${rank}`
    const isLight = (FILES.indexOf(file) + Number.parseInt(rank)) % 2 === 0
    const isSelected = selectedSquare === square
    const isPossibleMove = possibleMoves.includes(square)
    const piece = getPieceAt(square)
    const lastMove = moveHistory[moveHistory.length - 1]
    const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square)
    const frozen = frozenSquares[activeColor].includes(square) || frozenSquares[activeColor === 'white' ? 'black' : 'white'].includes(square)

    let borderColor = "transparent"
    let borderWidth = 0
    if (isPossibleMove && piece) { borderColor = '#dc2626'; borderWidth = 2 }
    else if (isPossibleMove) { borderColor = '#16a34a'; borderWidth = 2 }
    else if (isSelected) { borderColor = '#2563eb'; borderWidth = 2 }
    else if (isLastMove) { borderColor = '#f59e0b'; borderWidth = 1 }
    if (frozen) { borderColor = '#ef4444'; borderWidth = 2 }

    return (
      <View key={square} style={{ position: 'relative' }}>
        <TouchableOpacity
          style={[variantStyles.square, { width: squareSize, height: squareSize, backgroundColor: isLight ? '#F0D9B5' : '#769656', borderWidth, borderColor }]}
          onPress={() => handleSquarePress(square)}
        >
          {file === 'a' && (
            <Text style={[variantStyles.coordinateLabel, variantStyles.rankLabel, { color: isLight ? '#769656' : '#F0D9B5', fontSize: coordinateFontSize }]}>
              {rank}
            </Text>
          )}
          {rank === '1' && (
            <Text style={[variantStyles.coordinateLabel, variantStyles.fileLabel, { color: isLight ? '#769656' : '#F0D9B5', fontSize: coordinateFontSize }]}>
              {file}
            </Text>
          )}
          {piece && getPieceComponent(piece, squareSize * 0.8)}
          {isPossibleMove && !piece && (
            <View style={[variantStyles.possibleMoveDot, { width: squareSize * 0.25, height: squareSize * 0.25, borderRadius: squareSize * 0.125 }]} />
          )}
          {isPossibleMove && piece && (
            <View style={[variantStyles.captureIndicator, { width: squareSize * 0.3, height: squareSize * 0.3, borderRadius: squareSize * 0.15 }]} />
          )}
        </TouchableOpacity>
      </View>
    )
  }

  const renderBoard = () => {
    const files = boardFlipped ? [...FILES].reverse() : FILES
    const ranks = boardFlipped ? [...RANKS].reverse() : RANKS
    return (
      <View style={variantStyles.boardContainer}>
        <View style={variantStyles.board}>
          {ranks.map((rank) => (
            <View key={rank} style={variantStyles.row}>
              {files.map((file) => renderSquare(file, rank))}
            </View>
          ))}
        </View>
      </View>
    )
  }

  const formatTime = (ms: number) => { if (!Number.isFinite(ms) || ms <= 0) return "0:00"; const total = Math.floor(ms / 1000); const m = Math.floor(total / 60); const s = total % 60; return `${m}:${String(s).padStart(2,'0')}` }

  const navigateBack = () => router.replace('/(offline)')
  const resign = () => { if (!gameEnded) endGame('resignation', activeColor === 'white' ? 'black' : 'white', `${capitalize(activeColor)} resigned`) }
  const offerDraw = () => { if (!gameEnded) Alert.alert('Draw', 'Agree to a draw?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Agree', onPress: () => endGame('draw', null, 'Mutual agreement') }]) }

  const queenBadge = (color: Color) => {
    const q = queenDecay[color]
    return (
      <Text style={{ color: q.frozen ? '#ef4444' : q.active ? '#f59e0b' : '#a1a1aa' }}>
        Q {q.frozen ? 'Frozen' : q.active ? `${Math.ceil(q.timeRemaining/1000)}s` : '—'}
      </Text>
    )
  }
  const majorBadge = () => (
    <Text style={{ color: majorDecay.frozen ? '#ef4444' : majorDecay.active ? '#f59e0b' : '#a1a1aa' }}>
      Major {majorDecay.frozen ? 'Frozen' : majorDecay.active ? `${Math.ceil(majorDecay.timeRemaining/1000)}s` : '—'}
    </Text>
  )

  return (
    <Layout
      onProfile={() => router.push('/(main)/profile' as any)}
      onLogout={() => router.push('/(auth)/login' as any)}
      onSelectHome={() => router.push('/(main)/choose' as any)}
      onSelectOffline={() => router.push('/(offline)' as any)}
      isChooseScreen={false}
      hideTopNav={true}
      hideNavigation={true}
      activeBottomTab="offline"
    >
      <View style={[variantStyles.container, styles.container]}>        
        {/* Top player */}
        <View style={[variantStyles.playerInfoContainer, activeColor === (boardFlipped ? 'white' : 'black') && variantStyles.activePlayerContainer]}>
          <View style={variantStyles.playerHeader}>
            <View style={variantStyles.playerDetails}>
              <View style={variantStyles.playerNameRow}>
                <View style={variantStyles.playerAvatar}><Text style={variantStyles.playerAvatarText}>B</Text></View>
                <View style={variantStyles.playerNameContainer}><Text style={[variantStyles.playerName]} numberOfLines={1}>Player 2</Text></View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>{queenBadge('black')}{majorBadge()}</View>
            </View>
            <View style={[variantStyles.timerContainer, activeColor === 'black' && variantStyles.activeTimerContainer]}>
              <Text style={[variantStyles.timerText, activeColor === 'black' && variantStyles.activeTimerText]}>{formatTime(timers.black)}</Text>
            </View>
          </View>
        </View>

        {renderBoard()}

        {/* Bottom player */}
        <View style={[variantStyles.playerInfoContainer, activeColor === (boardFlipped ? 'black' : 'white') && variantStyles.activePlayerContainer]}>
          <View style={variantStyles.playerHeader}>
            <View style={variantStyles.playerDetails}>
              <View style={variantStyles.playerNameRow}>
                <View style={variantStyles.playerAvatar}><Text style={variantStyles.playerAvatarText}>W</Text></View>
                <View style={variantStyles.playerNameContainer}><Text style={[variantStyles.playerName]} numberOfLines={1}>Player 1</Text></View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>{queenBadge('white')}{majorBadge()}</View>
            </View>
            <View style={[variantStyles.timerContainer, activeColor === 'white' && variantStyles.activeTimerContainer]}>
              <Text style={[variantStyles.timerText, activeColor === 'white' && variantStyles.activeTimerText]}>{formatTime(timers.white)}</Text>
            </View>
          </View>
        </View>

        <View style={variantStyles.bottomBar}>
          <TouchableOpacity style={variantStyles.bottomBarButton} onPress={() => setShowMoveHistory(true)}>
            <Text style={variantStyles.bottomBarIcon}>≡</Text>
            <Text style={variantStyles.bottomBarLabel}>Moves</Text>
          </TouchableOpacity>
          <TouchableOpacity style={variantStyles.bottomBarButton} onPress={() => resign()}>
            <Text style={variantStyles.bottomBarIcon}>✕</Text>
            <Text style={variantStyles.bottomBarLabel}>Resign</Text>
          </TouchableOpacity>
          <TouchableOpacity style={variantStyles.bottomBarButton} onPress={() => offerDraw()}>
            <Text style={variantStyles.bottomBarIcon}>½</Text>
            <Text style={variantStyles.bottomBarLabel}>Draw</Text>
          </TouchableOpacity>
        </View>

        {/* Move History */}
        {showMoveHistory && (
          <Modal visible={showMoveHistory} transparent animationType="slide">
            <View style={variantStyles.modalOverlay}>
              <View style={variantStyles.moveHistoryModal}>
                <View style={variantStyles.moveHistoryHeader}>
                  <Text style={variantStyles.moveHistoryTitle}>📜 Move History</Text>
                  <TouchableOpacity onPress={() => setShowMoveHistory(false)} style={variantStyles.closeButton}><Text style={variantStyles.closeButtonText}>✕</Text></TouchableOpacity>
                </View>
                <ScrollView style={variantStyles.moveHistoryScroll}>
                  {moveHistory.map((m, idx) => (
                    <View key={idx} style={variantStyles.moveRow}>
                      <Text style={variantStyles.moveNumber}>{idx + 1}.</Text>
                      <Text style={variantStyles.moveText}>{m?.san || `${m?.from || ''}-${m?.to || ''}`}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* Promotion Modal */}
        {promotionModal && (
          <Modal visible={promotionModal.visible} transparent animationType="fade">
            <View style={variantStyles.modalOverlay}>
              <View style={variantStyles.promotionModal}>
                <Text style={variantStyles.promotionTitle}>Choose Promotion</Text>
                <View style={variantStyles.promotionOptions}>
                  {promotionModal.options.map((p) => (
                    <TouchableOpacity key={p} style={variantStyles.promotionOption} onPress={() => handlePromotionSelect(p)}>
                      <Text style={variantStyles.promotionPieceText}>{p.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={[variantStyles.menuButton, { backgroundColor: '#4a4a4a', marginTop: 16 }]} onPress={() => setPromotionModal(null)}>
                  <Text style={variantStyles.menuButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* End Modal */}
        {gameEnded && (
          <Modal visible={gameEnded} transparent animationType="slide">
            <View style={variantStyles.modalOverlay}>
              <View style={[variantStyles.gameEndModal]}>
                <Text style={[variantStyles.gameEndTitle]}>Game Over</Text>
                <Text style={variantStyles.gameEndMessage}>{resultMessage}</Text>
                <TouchableOpacity style={variantStyles.menuButton} onPress={() => router.replace('/(offline)')}>
                  <Text style={variantStyles.menuButtonText}>Back to Menu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Layout>
  )
}

const styles = StyleSheet.create({
  container: { paddingTop: 0 },
})

