export type QnA = {
    id: string
    productId: string
    userId: string
    userName: string
    question: string
    answer: string | null
    answeredAt: string | null
    isSecret: boolean
    createdAt: string
}
