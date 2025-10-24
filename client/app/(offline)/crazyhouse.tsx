"use client"

import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { Alert, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View, StyleSheet } from "react-native"
import { Chess } from "chess.js"
import Layout from "../components/layout/Layout"
import { variantStyles } from "@/app/lib/styles"
import { getPieceComponent } from "../components/game/chessPieces"

type Color = "white" | "black"
type PocketPiece = { id: string; type: string; timerPaused?: boolean; remainingTime?: number }

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

const DROP_TIME_LIMIT = 10000

export default function CrazyhouseOffline() {
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
  const [dropMode, setDropMode] = useState<boolean>(false)
  const [timers, setTimers] = useState<{ white: number; black: number }>({ white: baseTime, black: baseTime })
  const [pockets, setPockets] = useState<{ white: PocketPiece[]; black: PocketPiece[] }>({ white: [], black: [] })
  const dropTimersRef = useRef<{ white: Map<string, number>; black: Map<string, number> }>(
    { white: new Map(), black: new Map() }
  )

  const turnStartRef = useRef<number>(Date.now())
  const lastTickRef = useRef<number>(Date.now())
  const intervalRef = useRef<any>(null)
  const [gameEnded, setGameEnded] = useState(false)
  const [resultMessage, setResultMessage] = useState<string>("")
  const [winner, setWinner] = useState<Color | null>(null)

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
    // Tick loop for main timers and drop timer expiration
    lastTickRef.current = Date.now()
    turnStartRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      if (gameEnded) return
      const now = Date.now()
      const delta = now - lastTickRef.current
      lastTickRef.current = now

      setTimers((prev) => {
        const next = { ...prev }
        const c = activeColor
        next[c] = Math.max(0, next[c] - delta)
        if (next[c] <= 0 && !gameEnded) {
          endGame('timeout', c === 'white' ? 'black' : 'white', `${capitalize(c)} ran out of time`)
        }
        return next
      })

      // Handle drop timer for first pocket piece of active player
      const timersMap = dropTimersRef.current[activeColor]
      const pocket = pockets[activeColor]
      if (pocket.length > 0) {
        const first = pocket[0]
        const exp = timersMap.get(first.id)
        if (exp && now >= exp) {
          // expire and remove the first piece
          timersMap.delete(first.id)
          setPockets((prev) => {
            const updated = { ...prev }
            updated[activeColor] = prev[activeColor].slice(1)
            // Start next piece timer
            if (updated[activeColor].length > 0) {
              const nextPiece = updated[activeColor][0]
              timersMap.set(nextPiece.id, Date.now() + DROP_TIME_LIMIT)
            }
            return updated
          })
        } else if (!exp) {
          // start timer for first piece
          timersMap.set(first.id, now + DROP_TIME_LIMIT)
        }
      }
    }, 250)

    return () => intervalRef.current && clearInterval(intervalRef.current)
  }, [activeColor, pockets, gameEnded])

  const uuid = () => Math.random().toString(36).slice(2)
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
      else {
        if (col === fileIndex) return c
        col++
      }
    }
    return null
  }

  const isPieceOwnedBy = (piece: string, color: Color) => color === 'white' ? piece === piece.toUpperCase() : piece === piece.toLowerCase()

  // Pause previous color's drop timer and resume new color's first piece timer
  const onTurnChange = (prev: Color, next: Color) => {
    // Pause prev
    const prevPocket = pockets[prev]
    if (prevPocket.length > 0) {
      const first = prevPocket[0]
      const exp = dropTimersRef.current[prev].get(first.id)
      if (exp) {
        const remain = Math.max(0, exp - Date.now())
        first.timerPaused = true
        first.remainingTime = remain
        dropTimersRef.current[prev].delete(first.id)
      }
    }
    // Resume next
    const nextPocket = pockets[next]
    if (nextPocket.length > 0) {
      const first = nextPocket[0]
      let resumeMs = first.timerPaused && typeof first.remainingTime === 'number' ? first.remainingTime : DROP_TIME_LIMIT
      first.timerPaused = false
      delete first.remainingTime
      dropTimersRef.current[next].set(first.id, Date.now() + resumeMs)
    }
  }

  const attemptDrop = (to: string) => {
    if (gameEnded) return
    const pocket = pockets[activeColor]
    if (pocket.length === 0) return Alert.alert('No pocket', 'No pieces available to drop')
    const first = pocket[0]

    // Pawn drop cannot be on rank 1/8
    const targetRank = parseInt(to[1], 10)
    if (first.type.toLowerCase() === 'p' && (targetRank === 1 || targetRank === 8)) {
      Alert.alert('Invalid drop', 'Pawns cannot be dropped on 1st or 8th rank')
      return
    }
    // Must be empty square
    if (getPieceAt(to)) {
      Alert.alert('Invalid drop', 'Square is not empty')
      return
    }

    // Validate with test game
    const test = new Chess(game.fen())
    try {
      test.put({ type: first.type as any, color: activeColor === 'white' ? 'w' : 'b' }, to)
      // Toggle turn manually
      const parts = test.fen().split(' ')
      parts[1] = parts[1] === 'w' ? 'b' : 'w'
      test.load(parts.join(' '))
      if (test.inCheck() && test.turn() === (activeColor === 'white' ? 'w' : 'b')) {
        Alert.alert('Illegal drop', 'Drop would leave your king in check')
        return
      }
    } catch (e: any) {
      Alert.alert('Illegal drop', e?.message || 'Cannot drop piece there')
      return
    }

    // Apply to actual game
    const newGame = new Chess(game.fen())
    newGame.put({ type: first.type as any, color: activeColor === 'white' ? 'w' : 'b' }, to)
    const parts = newGame.fen().split(' ')
    parts[1] = parts[1] === 'w' ? 'b' : 'w'
    newGame.load(parts.join(' '))

    // Update timers: deduct elapsed, add increment to mover
    const now = Date.now()
    const elapsed = now - turnStartRef.current
    setTimers((prev) => {
      const next = { ...prev }
      next[activeColor] = Math.max(0, next[activeColor] - elapsed) + increment
      return next
    })

    // Update pockets (remove first), start next timer
    dropTimersRef.current[activeColor].delete(first.id)
    setPockets((prev) => {
      const updated = { ...prev }
      updated[activeColor] = prev[activeColor].slice(1)
      if (updated[activeColor].length > 0) {
        const n = updated[activeColor][0]
        dropTimersRef.current[activeColor].set(n.id, Date.now() + DROP_TIME_LIMIT)
      }
      return updated
    })

    // Commit
    setGame(newGame)
    setFen(newGame.fen())
    setMoveHistory((prev) => [...prev, { from: 'pocket', to, san: `${first.type.toUpperCase()}@${to}` }])
    const nextColor: Color = activeColor === 'white' ? 'black' : 'white'
    onTurnChange(activeColor, nextColor)
    setActiveColor(nextColor)
    setSelectedSquare(null)
    setPossibleMoves([])
    setDropMode(false)
    turnStartRef.current = Date.now()

    // Check end conditions
    if (newGame.isCheckmate()) return endGame('checkmate', nextColor === 'white' ? 'black' : 'white', 'Checkmate')
    if (newGame.isDraw()) return endGame('draw', null, 'Draw')
    if (newGame.isStalemate()) return endGame('draw', null, 'Stalemate')
  }

  const handleSquarePress = (square: string) => {
    if (gameEnded) return
    if (dropMode) {
      attemptDrop(square)
      return
    }

    if (selectedSquare === square) {
      setSelectedSquare(null)
      setPossibleMoves([])
      return
    }

    if (selectedSquare && possibleMoves.includes(square)) {
      const promoting = shouldPromote(selectedSquare, square)
      if (promoting) {
        setPromotionModal({ visible: true, from: selectedSquare, to: square, options: ['q', 'r', 'b', 'n'] })
        return
      }
      applyMove({ from: selectedSquare, to: square })
      setSelectedSquare(null)
      setPossibleMoves([])
      return
    }

    const piece = getPieceAt(square)
    if (piece && isPieceOwnedBy(piece, activeColor)) {
      setSelectedSquare(square)
      try {
        const moves = game.moves({ square, verbose: true }) as any[]
        setPossibleMoves(moves.map((m) => m.to))
      } catch {
        setPossibleMoves([])
      }
    } else {
      setSelectedSquare(null)
      setPossibleMoves([])
    }
  }

  const applyMove = (m: { from: string; to: string; promotion?: string }) => {
    if (gameEnded) return
    const now = Date.now()
    const elapsed = now - turnStartRef.current

    // Deduct elapsed from mover
    setTimers((prev) => {
      const next = { ...prev }
      next[activeColor] = Math.max(0, next[activeColor] - elapsed)
      return next
    })

    const newGame = new Chess(game.fen())
    const targetPiece = newGame.get(m.to)
    let result
    try {
      result = newGame.move(m)
    } catch {
      Alert.alert('Invalid move', 'This move is not legal.')
      return
    }
    if (!result) {
      Alert.alert('Invalid move', 'This move is not legal.')
      return
    }

    // Capture handling -> add captured to mover pocket (type stored as lowercase)
    if (targetPiece) {
      const capType = targetPiece.type // lowercase
      setPockets((prev) => {
        const updated = { ...prev }
        updated[activeColor] = [...prev[activeColor], { id: uuid(), type: capType }]
        return updated
      })
    }

    // Add increment post-move
    if (increment > 0) {
      setTimers((prev) => ({ ...prev, [activeColor]: prev[activeColor] + increment }))
    }

    // Update histories
    setCaptured((prev) => prev) // we could track
    setMoveHistory((prev) => [...prev, result])
    setGame(newGame)
    setFen(newGame.fen())
    const nextColor: Color = activeColor === 'white' ? 'black' : 'white'
    onTurnChange(activeColor, nextColor)
    setActiveColor(nextColor)
    turnStartRef.current = Date.now()
    setSelectedSquare(null)
    setPossibleMoves([])
    setDropMode(false)

    // Start timer for first pocket piece if any now that turn changed handled by onTurnChange

    // End conditions
    if (newGame.isCheckmate()) return endGame('checkmate', nextColor === 'white' ? 'black' : 'white', 'Checkmate')
    if (newGame.isDraw()) return endGame('draw', null, 'Draw')
    if (newGame.isStalemate()) return endGame('draw', null, 'Stalemate')
  }

  const shouldPromote = (from: string, to: string) => {
    const piece = getPieceAt(from)
    if (!piece) return false
    if (piece.toLowerCase() !== 'p') return false
    if (activeColor === 'white' && to[1] === '8') return true
    if (activeColor === 'black' && to[1] === '1') return true
    return false
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

    let borderColor = "transparent"
    let borderWidth = 0
    if (isPossibleMove && piece) { borderColor = '#dc2626'; borderWidth = 2 }
    else if (isPossibleMove) { borderColor = '#16a34a'; borderWidth = 2 }
    else if (isSelected) { borderColor = '#2563eb'; borderWidth = 2 }
    else if (isLastMove) { borderColor = '#f59e0b'; borderWidth = 1 }

    return (
      <View key={square} style={{ position: 'relative' }}>
        <TouchableOpacity
          style={[
            variantStyles.square,
            { width: squareSize, height: squareSize, backgroundColor: isLight ? '#F0D9B5' : '#769656', borderWidth, borderColor },
          ]}
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
          {dropMode && !piece && (
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

  const formatTime = (ms: number) => {
    if (!Number.isFinite(ms) || ms <= 0) return "0:00"
    const total = Math.floor(ms / 1000)
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const pocketDisplay = (color: Color) => {
    const pocket = pockets[color]
    if (!pocket || pocket.length === 0) return null
    const first = pocket[0]
    const exp = dropTimersRef.current[color].get(first.id)
    const remain = exp ? Math.max(0, exp - Date.now()) : first.timerPaused && first.remainingTime ? first.remainingTime : 0
    return (
      <View style={styles.pocketRow}>
        <Text style={styles.pocketLabel}>{color === 'white' ? 'White' : 'Black'} pocket</Text>
        <View style={styles.pocketPieces}>
          {pocket.map((p, idx) => (
            <View key={p.id} style={styles.pocketPiece}>
              {getPieceComponent(color === 'white' ? p.type.toUpperCase() : p.type.toLowerCase(), 22)}
              {idx === 0 && (
                <Text style={styles.pocketTimer}>{Math.ceil((remain || 0) / 1000)}s</Text>
              )}
            </View>
          ))}
        </View>
        {color === activeColor && pocket.length > 0 && (
          <TouchableOpacity style={styles.dropToggle} onPress={() => setDropMode((x) => !x)}>
            <Text style={styles.dropToggleText}>{dropMode ? 'Cancel Drop' : 'Drop'}</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  const navigateBack = () => router.replace('/(offline)')
  const resign = () => { if (!gameEnded) endGame('resignation', activeColor === 'white' ? 'black' : 'white', `${capitalize(activeColor)} resigned`) }
  const offerDraw = () => { if (!gameEnded) Alert.alert('Draw', 'Agree to a draw?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Agree', onPress: () => endGame('draw', null, 'Mutual agreement') }]) }

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
        {/* Top player info */}
        <View style={[variantStyles.playerInfoContainer, activeColor === (boardFlipped ? 'white' : 'black') && variantStyles.activePlayerContainer]}>
          <View style={variantStyles.playerHeader}>
            <View style={variantStyles.playerDetails}>
              <View style={variantStyles.playerNameRow}>
                <View style={variantStyles.playerAvatar}><Text style={variantStyles.playerAvatarText}>B</Text></View>
                <View style={variantStyles.playerNameContainer}><Text style={[variantStyles.playerName]} numberOfLines={1}>Player 2</Text></View>
              </View>
              {/* Black pocket */}
              {pocketDisplay('black')}
            </View>
            <View style={[variantStyles.timerContainer, activeColor === 'black' && variantStyles.activeTimerContainer]}>
              <Text style={[variantStyles.timerText, activeColor === 'black' && variantStyles.activeTimerText]}>{formatTime(timers.black)}</Text>
            </View>
          </View>
        </View>

        {renderBoard()}

        {/* Bottom player info */}
        <View style={[variantStyles.playerInfoContainer, activeColor === (boardFlipped ? 'black' : 'white') && variantStyles.activePlayerContainer]}>
          <View style={variantStyles.playerHeader}>
            <View style={variantStyles.playerDetails}>
              <View style={variantStyles.playerNameRow}>
                <View style={variantStyles.playerAvatar}><Text style={variantStyles.playerAvatarText}>W</Text></View>
                <View style={variantStyles.playerNameContainer}><Text style={[variantStyles.playerName]} numberOfLines={1}>Player 1</Text></View>
              </View>
              {/* White pocket */}
              {pocketDisplay('white')}
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
          <TouchableOpacity style={variantStyles.bottomBarButton} onPress={resign}>
            <Text style={variantStyles.bottomBarIcon}>✕</Text>
            <Text style={variantStyles.bottomBarLabel}>Resign</Text>
          </TouchableOpacity>
          <TouchableOpacity style={variantStyles.bottomBarButton} onPress={offerDraw}>
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
                <TouchableOpacity style={variantStyles.menuButton} onPress={navigateBack}>
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
  pocketRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center' },
  pocketLabel: { color: '#a1a1aa', marginRight: 8 },
  pocketPieces: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 },
  pocketPiece: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pocketTimer: { color: '#f59e0b', fontSize: 12 },
  dropToggle: { backgroundColor: '#2563eb', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  dropToggleText: { color: '#fff', fontWeight: '600' },
})
