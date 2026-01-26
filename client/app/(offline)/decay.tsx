"use client"

import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { Alert, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View, StyleSheet } from "react-native"
import { Chess } from "chess.js"
import type { Square, Move } from "chess.js"
import Layout from "../components/layout/Layout"
import { variantStyles } from "@/app/lib/styles"
import { getPieceComponent } from "../components/game/chessPieces"

type Color = "white" | "black"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

// Decay timer constants - Queen-only decay (simplified variant)
const QUEEN_INITIAL_DECAY_TIME = 25000 // 25 seconds
const DECAY_INCREMENT = 2000 // +2 seconds per move of the decaying piece

export default function DecayOffline() {
  const router = useRouter()
  // Offline simplified timing: fixed 3:00 each, no increment
  const params = useLocalSearchParams<{ baseTime?: string; increment?: string }>()
  const baseTime = 180000
  const increment = 0

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

  // Decay state - Queen-only decay (simplified variant)
  interface DecayTimer {
    active: boolean
    frozen: boolean
    timeRemaining: number
    square?: string
    count: number
  }
  
  const [queenDecay, setQueenDecay] = useState<{ white: DecayTimer; black: DecayTimer }>({
    white: { active: false, frozen: false, timeRemaining: 0, count: 0 },
    black: { active: false, frozen: false, timeRemaining: 0, count: 0 },
  })
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

      // main timers - only deduct from active player
      setTimers((prev) => {
        const next = { ...prev }
        const c = activeColor
        next[c] = Math.max(0, next[c] - delta)
        if (next[c] <= 0 && !gameEnded) endGame('timeout', c === 'white' ? 'black' : 'white', `${capitalize(c)} ran out of time`)
        return next
      })

      // Queen decay timer counts down ONLY during the active player's turn
      setQueenDecay((prev) => {
        const next = { ...prev }
        const q = next[activeColor]
        if (q.active && !q.frozen) {
          q.timeRemaining = Math.max(0, q.timeRemaining - delta)
          if (q.timeRemaining <= 0) {
            q.frozen = true
            q.active = false
            // Only add to frozen squares if there's actually a queen at that square
            if (q.square) {
              const pieceAtSquare = getPieceAt(q.square)
              if (pieceAtSquare && pieceAtSquare.toLowerCase() === 'q') {
                setFrozenSquares((fs) => {
                  const updated = { ...fs }
                  if (!updated[activeColor].includes(q.square!)) {
                    updated[activeColor] = [...updated[activeColor], q.square!]
                  }
                  return updated
                })
              }
            }
          }
        }
        return next
      })
    }, 250)

    return () => intervalRef.current && clearInterval(intervalRef.current)
  }, [activeColor, gameEnded])

  // Cleanup frozen squares: remove invalid entries (only queens can be frozen)
  useEffect(() => {
    const cleanupFrozenSquares = () => {
      setFrozenSquares((fs) => {
        const updated = { ...fs }
        let changed = false
        
        ;(['white', 'black'] as Color[]).forEach((color) => {
          const validSquares = updated[color].filter((square) => {
            const piece = getPieceAt(square)
            if (!piece) {
              changed = true
              return false // Piece no longer exists
            }
            const pieceType = piece.toLowerCase()
            // Only queens can be frozen in this simplified variant
            if (pieceType === 'q') {
              return true
            }
            // All other pieces cannot be frozen - remove them
            changed = true
            return false
          })
          if (validSquares.length !== updated[color].length) {
            updated[color] = validSquares
            changed = true
          }
        })
        
        return changed ? updated : fs
      })
    }
    
    cleanupFrozenSquares()
  }, [fen]) // Re-validate whenever board state changes

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  // Helper function to get legal moves while considering frozen pieces
  // Frozen pieces should not control squares or affect opponent's legal moves
  const getLegalMovesForSquare = (square: string): string[] => {
    // Get all frozen squares from both colors
    const allFrozenSquares = [...frozenSquares.white, ...frozenSquares.black]
    
    if (allFrozenSquares.length === 0) {
      // No frozen pieces, use normal move generation
      try {
        const moves = game.moves({ square: square as any, verbose: true }) as any[]
        return moves.map((m) => m.to)
      } catch {
        return []
      }
    }

    // Create a temporary game state without frozen pieces
    const tempGame = new Chess(game.fen())
    
    // Remove all frozen pieces from the board temporarily
    const removedPieces: { square: string; piece: any }[] = []
    allFrozenSquares.forEach((frozenSquare) => {
      try {
        const piece = tempGame.get(frozenSquare as Square)
        if (piece) {
          removedPieces.push({ square: frozenSquare, piece })
          tempGame.remove(frozenSquare as Square)
        }
      } catch {
        // Square doesn't exist or piece already removed
      }
    })

    // Calculate legal moves without frozen pieces affecting the board
    let legalMoves: string[] = []
    try {
      const moves = tempGame.moves({ square: square as any, verbose: true }) as any[]
      legalMoves = moves.map((m) => m.to)
    } catch {
      legalMoves = []
    }

    return legalMoves
  }

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

  const getPieceColor = (p: string): Color => (p === p.toUpperCase() ? 'white' : 'black')

  const findQueenInfo = (gameInstance: Chess, color: Color): { exists: boolean; square?: string } => {
    const board = gameInstance.board()
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = board[r][f]
        if (sq && sq.type === 'q' && (color === 'white' ? sq.color === 'w' : sq.color === 'b')) {
          const square = `${FILES[f]}${8 - r}`
          return { exists: true, square }
        }
      }
    }
    return { exists: false }
  }

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
      const legalMoves = getLegalMovesForSquare(square)
      setPossibleMoves(legalMoves)
    } else { setSelectedSquare(null); setPossibleMoves([]) }
  }

  const applyMove = (m: { from: string; to: string; promotion?: string }) => {
    if (gameEnded) return
    // Block moving frozen piece
    if (frozenSquares[activeColor].includes(m.from)) { Alert.alert('Frozen', 'This piece cannot move.'); return }

    // Offline simple mode: do not adjust time on move; timers tick only during turn via interval

    // Create game state without frozen pieces for move validation
    const allFrozenSquares = [...frozenSquares.white, ...frozenSquares.black]
    const newGame = new Chess(game.fen())
    
    // Remove frozen pieces temporarily for move validation
    const removedPieces: { square: string; piece: any }[] = []
    allFrozenSquares.forEach((frozenSquare) => {
      try {
        const piece = newGame.get(frozenSquare as Square)
        if (piece) {
          removedPieces.push({ square: frozenSquare, piece })
          newGame.remove(frozenSquare as Square)
        }
      } catch {
        // Ignore errors
      }
    })

    const targetPiece = newGame.get(m.to as Square)
    let result: Move | null = null
    try { result = newGame.move(m) } catch { Alert.alert('Invalid move', 'This move is not legal.'); return }
    if (!result) { Alert.alert('Invalid move', 'This move is not legal.'); return }

    // Restore frozen pieces to the new game state
    removedPieces.forEach(({ square, piece }) => {
      try {
        newGame.put(piece, square as Square)
      } catch {
        // Ignore errors
      }
    })

    // Capture track
    if (targetPiece) {
      const capType = targetPiece.type
      setCaptured((prev) => ({ ...prev, [activeColor]: [...prev[activeColor], capType] }))
      
      // Remove captured piece from frozen squares if it was frozen
      const capturedColor = activeColor === 'white' ? 'black' : 'white'
      setFrozenSquares((fs) => {
        const updated = { ...fs }
        const index = updated[capturedColor].indexOf(m.to)
        if (index !== -1) {
          updated[capturedColor] = updated[capturedColor].filter((sq) => sq !== m.to)
        }
        return updated
      })
    }

    // Handle decay triggers - Queen-only decay
    const piece = result.piece as string
    const movedTo = m.to
    // Only treat it as a queen move if the piece that moved was already a queen (not a pawn promoting)
    // Timer should only start when a queen that already exists on the board moves
    const isQueenMove = piece.toLowerCase() === 'q'

    // Sync queen decay state to board (handles queen capture and square updates)
    setQueenDecay((prev) => {
      const next = { ...prev }
      // If the moving piece is an actual queen (not pawn promotion), update its timer
      if (isQueenMove) {
        const q = next[activeColor]
        if (!q.active && !q.frozen) {
          // First queen move - start the timer
          next[activeColor] = { ...q, active: true, frozen: false, timeRemaining: QUEEN_INITIAL_DECAY_TIME, square: movedTo, count: 1 }
        } else if (q.active && !q.frozen) {
          // Queen already has active timer - add time
          next[activeColor] = {
            ...q,
            count: q.count + 1,
            timeRemaining: Math.min(QUEEN_INITIAL_DECAY_TIME, q.timeRemaining + DECAY_INCREMENT),
            square: movedTo,
          }
        } else if (q.frozen) {
          // This queen was previously frozen (original queen lost, this is a promoted queen moving)
          // Reset and start fresh timer for the new/promoted queen
          next[activeColor] = { active: true, frozen: false, timeRemaining: QUEEN_INITIAL_DECAY_TIME, square: movedTo, count: 1 }
        }
      }

      (['white', 'black'] as Color[]).forEach((color: Color) => {
        const info = findQueenInfo(newGame, color)
        const q = next[color]
        if (!info.exists) {
          // Queen not on board: mark as frozen entry point for major decay with fresh timer (no carryover)
          next[color] = { active: false, frozen: true, timeRemaining: 0, count: 0 }
        } else {
          // Update queen square for display
          if (q.active || q.frozen) {
            next[color] = { ...q, square: info.square }
          }
        }
      })
      return next
    })

    // Increment applied above together with elapsed deduction

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
    // Only show frozen indicator if the piece is actually a queen (only queens can freeze)
    const isFrozenSquare = frozenSquares[activeColor].includes(square) || frozenSquares[activeColor === 'white' ? 'black' : 'white'].includes(square)
    const frozen = isFrozenSquare && piece && piece.toLowerCase() === 'q'

    // Queen decay badge (small circle above piece showing remaining time)
    let decayBadge: React.ReactNode = null
    if (piece) {
      const pieceColor = getPieceColor(piece)
      const queen = queenDecay[pieceColor]
      const showQueen = queen.active && !queen.frozen && queen.square === square
      if (showQueen) {
        const time = Math.max(0, Math.ceil(queen.timeRemaining / 1000))
        decayBadge = (
          <View
            style={{
              position: 'absolute',
              top: -14,
              alignSelf: 'center',
              backgroundColor: '#f59e0b',
              width: 24,
              height: 24,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#1f2937',
            }}
          >
            <Text style={{ color: '#111827', fontSize: 10, fontWeight: '700' }}>{time}s</Text>
          </View>
        )
      }
    }

    let borderColor = "transparent"
    let borderWidth = 0
    if (isPossibleMove && piece) { borderColor = '#dc2626'; borderWidth = 2 }
    else if (isPossibleMove) { borderColor = '#16a34a'; borderWidth = 2 }
    else if (isSelected) { borderColor = '#2563eb'; borderWidth = 2 }
    else if (isLastMove) { borderColor = '#f59e0b'; borderWidth = 1 }
    if (frozen) { borderColor = '#ef4444'; borderWidth = 2 }

    return (
      <View key={square} style={{ position: 'relative', overflow: 'visible' }}>
        <TouchableOpacity
          style={[variantStyles.square, { width: squareSize, height: squareSize, backgroundColor: isLight ? '#F0D9B5' : '#769656', borderWidth, borderColor, overflow: 'visible' }]}
          onPress={() => handleSquarePress(square)}
        >
          {decayBadge}
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
        👑 Queen {q.frozen ? 'Frozen' : q.active ? `${Math.ceil(q.timeRemaining/1000)}s` : '—'}
      </Text>
    )
  }

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
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>{queenBadge('black')}</View>
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
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>{queenBadge('white')}</View>
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
                      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>{p.toUpperCase()}</Text>
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
