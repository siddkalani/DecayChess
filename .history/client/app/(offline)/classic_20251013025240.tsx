"use client"

import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { Alert, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { Chess } from "chess.js"
import Layout from "../components/layout/Layout"
import { variantStyles } from "@/app/lib/styles"
import { getPieceComponent } from "../components/game/chessPieces"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

type Color = "white" | "black"

export default function ClassicOffline() {
  const router = useRouter()
  const params = useLocalSearchParams<{ baseTime?: string; increment?: string }>()

  const baseTime = useMemo(() => Math.max(0, Number(params.baseTime ?? 600000)), [params.baseTime])
  const increment = useMemo(() => Math.max(0, Number(params.increment ?? 0)), [params.increment])

  const [game] = useState(() => new Chess())
  const [fen, setFen] = useState(game.fen())
  const [activeColor, setActiveColor] = useState<Color>("white")
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<string[]>([])
  const [moveHistory, setMoveHistory] = useState<any[]>([])
  const [captured, setCaptured] = useState<{ white: string[]; black: string[] }>({ white: [], black: [] })
  const [showMoveHistory, setShowMoveHistory] = useState(false)
  const [promotionModal, setPromotionModal] = useState<{ visible: boolean; from: string; to: string; options: string[] } | null>(null)
  const [boardFlipped, setBoardFlipped] = useState(false)

  const [timers, setTimers] = useState<{ white: number; black: number }>({ white: baseTime, black: baseTime })
  const turnStartRef = useRef<number>(Date.now())
  const lastTickRef = useRef<number>(Date.now())
  const intervalRef = useRef<any>(null)
  const [gameEnded, setGameEnded] = useState(false)
  const [resultMessage, setResultMessage] = useState<string>("")
  const [winner, setWinner] = useState<Color | null>(null)

  // Responsive sizes
  const screenWidth = Dimensions.get("window").width
  const screenHeight = Dimensions.get("window").height
  const isTablet = Math.min(screenWidth, screenHeight) > 600
  const isSmallScreen = screenWidth < 380
  const horizontalPadding = isSmallScreen ? 8 : isTablet ? 20 : 12
  const boardSize = screenWidth - horizontalPadding * 2
  const squareSize = boardSize / 8
  const coordinateFontSize = isSmallScreen ? 8 : 10

  useEffect(() => {
    // Initialize timing loop
    lastTickRef.current = Date.now()
    turnStartRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      if (gameEnded) return
      const now = Date.now()
      const delta = now - lastTickRef.current
      lastTickRef.current = now
      setTimers((prev) => {
        const next = { ...prev }
        const color = activeColor
        next[color] = Math.max(0, next[color] - delta)
        if (next[color] <= 0 && !gameEnded) {
          // Time out
          endGame("timeout", color === "white" ? "black" : "white", `${color} ran out of time`)
        }
        return next
      })
    }, 250)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [activeColor, gameEnded])

  const endGame = (result: string, winnerColor: Color | null, reason: string) => {
    setGameEnded(true)
    setWinner(winnerColor)
    if (intervalRef.current) clearInterval(intervalRef.current)

    let msg = ''
    if (result === 'checkmate') {
      msg = winnerColor ? `Checkmate! ${capitalize(winnerColor)} wins.` : 'Checkmate.'
    } else if (result === 'timeout') {
      msg = reason || 'Time expired.'
    } else if (result === 'draw') {
      msg = reason || 'Draw.'
    } else {
      msg = result
    }
    setResultMessage(msg)
  }

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  const formatTime = (ms: number) => {
    if (!Number.isFinite(ms) || ms <= 0) return "0:00"
    const total = Math.floor(ms / 1000)
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${String(s).padStart(2, '0')}`
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
      if (c >= '1' && c <= '8') {
        col += Number.parseInt(c)
      } else {
        if (col === fileIndex) return c
        col++
      }
    }
    return null
  }

  const isPieceOwnedBy = (piece: string, color: Color) => color === 'white' ? piece === piece.toUpperCase() : piece === piece.toLowerCase()

  const handleSquarePress = (square: string) => {
    if (gameEnded) return

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

  const shouldPromote = (from: string, to: string) => {
    const piece = getPieceAt(from)
    if (!piece) return false
    if (piece.toLowerCase() !== 'p') return false
    if (activeColor === 'white' && to[1] === '8') return true
    if (activeColor === 'black' && to[1] === '1') return true
    return false
  }

  const applyMove = (m: { from: string; to: string; promotion?: string }) => {
    if (gameEnded) return

    // Deduct elapsed time from current player and add increment after move
    const now = Date.now()
    const elapsed = now - turnStartRef.current
    setTimers((prev) => {
      const next = { ...prev }
      next[activeColor] = Math.max(0, next[activeColor] - elapsed)
      return next
    })

    let result
    try {
      result = game.move(m)
    } catch {
      Alert.alert('Invalid move', 'This move is not legal.')
      return
    }
    if (!result) {
      Alert.alert('Invalid move', 'This move is not legal.')
      return
    }

    // Track capture
    if (result.captured) {
      const cap = result.captured as string
      const capturer = activeColor
      setCaptured((prev) => ({ ...prev, [capturer]: [...prev[capturer], cap] }))
    }

    // Update FEN and history
    setFen(game.fen())
    setMoveHistory((prev) => [...prev, result])

    // Add increment to player who just moved
    if (increment > 0) {
      setTimers((prev) => {
        const next = { ...prev }
        next[activeColor] = next[activeColor] + increment
        return next
      })
    }

    // Switch turn
    const nextColor: Color = activeColor === 'white' ? 'black' : 'white'
    setActiveColor(nextColor)
    turnStartRef.current = Date.now()

    // Check end conditions
    if (game.isCheckmate()) {
      endGame('checkmate', nextColor === 'white' ? 'black' : 'white', 'Checkmate')
      return
    }
    if (game.isDraw()) {
      endGame('draw', null, 'Draw')
      return
    }
    if (game.isStalemate()) {
      endGame('draw', null, 'Stalemate')
      return
    }
    // Continue
  }

  const handlePromotionSelect = (p: string) => {
    if (!promotionModal) return
    applyMove({ from: promotionModal.from, to: promotionModal.to, promotion: p })
    setPromotionModal(null)
    setSelectedSquare(null)
    setPossibleMoves([])
  }

  const renderCapturedPieces = (color: Color) => {
    const pieces = captured[color] || []
    if (pieces.length === 0) return null
    const pieceCounts: { [key: string]: number } = {}
    pieces.forEach((piece) => {
      const pieceType = color === 'white' ? piece.toLowerCase() : piece.toUpperCase()
      pieceCounts[pieceType] = (pieceCounts[pieceType] || 0) + 1
    })
    return (
      <View style={variantStyles.capturedPieces}>
        {Object.entries(pieceCounts).map(([piece, count]) => (
          <View key={piece} style={variantStyles.capturedPieceGroup}>
            {getPieceComponent(piece, isSmallScreen ? 14 : 16)}
            {count > 1 && <Text style={variantStyles.capturedCount}>{count}</Text>}
          </View>
        ))}
      </View>
    )
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

  const PlayerInfo = ({ color, top }: { color: Color; top: boolean }) => {
    const timer = timers[color]
    const isActive = activeColor === color && !gameEnded
    const label = color === 'white' ? 'Player 1' : 'Player 2'
    return (
      <View style={[variantStyles.playerInfoContainer, isActive && variantStyles.activePlayerContainer]}>
        <View style={variantStyles.playerHeader}>
          <View style={variantStyles.playerDetails}>
            <View style={variantStyles.playerNameRow}>
              <View style={variantStyles.playerAvatar}>
                <Text style={variantStyles.playerAvatarText}>{label.charAt(0)}</Text>
              </View>
              <View style={variantStyles.playerNameContainer}>
                <Text style={[variantStyles.playerName, isActive && variantStyles.activePlayerName]} numberOfLines={1}>{label}</Text>
                <Text style={variantStyles.playerRating}>(Local)</Text>
              </View>
              {top ? null : <Text style={variantStyles.youIndicator}>(Move)</Text>}
            </View>
            {renderCapturedPieces(color)}
          </View>
          <View style={[variantStyles.timerContainer, isActive && variantStyles.activeTimerContainer]}>
            <Text style={[variantStyles.timerText, isActive && variantStyles.activeTimerText]}>{formatTime(timer)}</Text>
          </View>
        </View>
      </View>
    )
  }

  const navigateBack = () => {
    router.replace('/(offline)')
  }

  const resign = () => {
    if (gameEnded) return
    const loser = activeColor
    endGame('resignation', loser === 'white' ? 'black' : 'white', `${capitalize(loser)} resigned`)
  }

  const offerDraw = () => {
    if (gameEnded) return
    Alert.alert('Draw', 'Agree to a draw?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Agree', onPress: () => endGame('draw', null, 'Mutual agreement') },
    ])
  }

  const lastMovePairs = useMemo(() => {
    const moves = moveHistory
    const pairs: { moveNumber: number; white: string; black: string }[] = []
    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({ moveNumber: Math.floor(i / 2) + 1, white: moves[i]?.san || '', black: moves[i + 1]?.san || '' })
    }
    return pairs
  }, [moveHistory])

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
      <View style={[variantStyles.container, offlineStyles.container]}>
        <PlayerInfo color={boardFlipped ? "black" : "white"} top={true} />
        {renderBoard()}
        <PlayerInfo color={boardFlipped ? "white" : "black"} top={false} />

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
                  <TouchableOpacity onPress={() => setShowMoveHistory(false)} style={variantStyles.closeButton}>
                    <Text style={variantStyles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={variantStyles.moveHistoryScroll}>
                  {lastMovePairs.map((pair, idx) => (
                    <View key={idx} style={variantStyles.moveRow}>
                      <Text style={variantStyles.moveNumber}>{pair.moveNumber}.</Text>
                      <Text style={variantStyles.moveText}>{pair.white}</Text>
                      <Text style={variantStyles.moveText}>{pair.black}</Text>
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

import { StyleSheet } from 'react-native'
const offlineStyles = StyleSheet.create({
  container: {
    paddingTop: 0,
  },
})
