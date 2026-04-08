export interface FirestoreTimestampValue {
  readonly seconds: number
  readonly nanoseconds: number
  toDate(): Date
  toMillis(): number
  toJSON(): { seconds: number; nanoseconds: number; type: string }
  valueOf(): string
  isEqual(other: FirestoreTimestampValue): boolean
}
