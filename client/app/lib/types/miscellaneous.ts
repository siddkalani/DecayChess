export interface Player {
  _id: string;
  name: string;
  email: string;
  ratings?: number;
  win?: number;
  lose?: number;
}


export interface TournamentOption {
  title: string
  description: string
  action: string
  rules: string
  height: number
}

export interface TournamentDetails {
  id: string
  name: string
  capacity: number
  startTime: number
  duration: number
  entryFee: number
  prizePool: number
  status: "open" | "in-progress" | "finished"
  participantsCount: number
  createdAt: number
}