import { Image } from "react-native"

interface ChessPieceProps {
  size: number
}

// Import all png files as static assets
const pieceAssets = {
  // White pieces
  K: require("../../../assets/wk.png"),
  Q: require("../../../assets/wq.png"),
  R: require("../../../assets/wr.png"),
  B: require("../../../assets/wb.png"),
  N: require("../../../assets/wn.png"),
  P: require("../../../assets/wp.png"),
  
  // Black pieces
  k: require("../../../assets/bk.png"),
  q: require("../../../assets/bq.png"),
  r: require("../../../assets/br.png"),
  b: require("../../../assets/bb.png"),
  n: require("../../../assets/bn.png"),
  p: require("../../../assets/bp.png"),
}// Helper function to get the appropriate piece component
export const getPieceComponent = (piece: string, size: number) => {
  const asset = pieceAssets[piece as keyof typeof pieceAssets]

  if (!asset) {
    return null
  }

  return (
    <Image
      source={asset}
      style={{
        width: size,
        height: size,
        resizeMode: "contain",
      }}
    />
  )
}

export default getPieceComponent;
